import File from './file';
import { IMod } from './mod';
import Settings from './settings';

import * as execa from 'execa';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import SteamApi from './steamApi';

export default class SteamCmd extends EventEmitter {
    private username: string;
    private password: string;

    private cmdPath: string;

    private process?: execa.ExecaChildProcess;

    constructor(user?: string, password?: string) {
        super();

        this.username = user ? user : 'anonymous';
        this.password = password ? password : '';

        this.cmdPath = Settings.get('steamCmdPath');
    }

    public login(args: string[] = [], debug = false): Promise<void> {
        return new Promise((resolve, reject) => {
            let timeout: NodeJS.Timeout;
            let hasTriedToLogin = false;
            let loggedIn = false;
            let okTimes = 0;

            this.emit('loggingIn' as SteamCmdEvents);

            const cmd = execa(this.cmdPath, [`+login ${this.username} ${this.password}`, ...args, '+quit']);
            cmd.catch(error => reject(error));

            // Casted to Readable/Writable because the typings suck
            const stdout = cmd.stdout as Readable;
            const stdin = cmd.stdin as Writable;

            if (debug) {
                stdout.pipe(process.stdout);
            }

            stdout.on('data', (data: Buffer) => {
                const text = data.toString();

                if (hasTriedToLogin) {
                    if (text.includes('FAILED login with result code')) {
                        clearTimeout(timeout);
                        this.process = undefined;
                        reject(new Error(text.split('\n')[0]));
                    }

                    if (text.includes('OK')) {
                        okTimes++;

                        // It outputs OK twice but not the full string
                        // One is when logged in and other when profile info has been downloaded
                        if (okTimes >= 2) {
                            clearTimeout(timeout);

                            loggedIn = true;
                            this.process = cmd;
                            this.emit('loggedIn' as SteamCmdEvents);
                        }
                    }
                } else {
                    if (text.includes('Logging in user') || text.includes('Connecting anonymously to')) {
                        hasTriedToLogin = true;

                        // As the Steam Guard code doesn't get outputed to stdout we do a wait (can be risky)
                        timeout = setTimeout(() => {
                            this.on('steamGuardSent' as SteamCmdEvents, (code: string) => {
                                stdin.write(`${code}\n`);
                            });
                            this.emit('steamGuardRequired' as SteamCmdEvents);
                        }, 10 * 1000);
                    }
                }
            });

            cmd.on('exit', () => {
                if (loggedIn) {
                    resolve();
                    this.process = undefined;
                } else {
                    clearTimeout(timeout);
                    this.process = undefined;
                    reject(new Error('Process closed and we did not log in.'));
                }
            });
        });
    }

    public async downloadWorkshopItem(mod: IMod, forceUpdate?: boolean): Promise<void> {
        const settings = Settings.getAll();
        const modDir = path.join(settings.gameServerPath, 'mods');
        const itemDir = path.join(settings.gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

        this.emit('itemComparingTimestamp' as SteamCmdEvents);

        const data = await SteamApi.getPublishedItemDetails(mod.itemId);

        const updatedAt = data.response.publishedfiledetails[0].time_updated;

        if (mod.updatedAt && ! forceUpdate) {
            if (updatedAt === mod.updatedAt) {
                this.emit('itemTimestampEqual' as SteamCmdEvents);

                return;
            }
        }

        mod.updatedAt = updatedAt;

        if (! fs.existsSync(modDir)) {
            fs.mkdirsSync(modDir);
        }

        const args = [];

        args.push(`+force_install_dir ${settings.gameServerPath}`);
        args.push(`+workshop_download_item ${mod.gameId} ${mod.itemId}`);

        await this.login(args);

        this.emit('steamDownloaded' as SteamCmdEvents);

        // @my_awesome_mod
        const dirName = `@${_.snakeCase(mod.name)}`;
        const modDownloadDir = path.join(modDir, dirName);

        if (! fs.existsSync(modDownloadDir)) {
            this.emit('itemCopying' as SteamCmdEvents);

            fs.copySync(itemDir, modDownloadDir);
        } else {
            this.emit('itemComparing' as SteamCmdEvents);

            const changedFiles = await File.compareFiles(itemDir, modDownloadDir);

            if (changedFiles.length === 0) {
                this.emit('itemNotUpdated' as SteamCmdEvents);
            }

            changedFiles.forEach(file => {
                if (file.includes(modDownloadDir)) {
                    fs.unlinkSync(file);
                } else {
                    fs.copySync(file, path.join(modDownloadDir, path.relative(itemDir, file)));
                }
            });
        }

        this.emit('itemUpdatingKeys' as SteamCmdEvents);

        const keyDir = path.join(settings.gameServerPath, 'keys');
        if (! fs.existsSync(keyDir)) {
            fs.mkdirsSync(keyDir);
        }

        // Remove old keys if present
        if (mod.keys) {
            mod.keys.forEach(key => {
                if (fs.existsSync(key)) {
                    fs.unlinkSync(key);
                } else {
                    _.remove(mod.keys as string[], key);
                }
            });
        }

        // Add new keys
        const keys = File.findFiles(modDownloadDir, '.bikey');

        keys.forEach(key => {
            fs.copyFile(key, path.join(keyDir, File.getFilename(key)));
        });

        // Change keys paths from mod dir to keys dir
        mod.keys = keys.map(key => path.join(keyDir, File.getFilename(key)));

        // Update keys in settings
        const modIndex = settings.mods.findIndex(el => el.itemId === mod.itemId);
        Object.assign(settings.mods[modIndex], mod);

        Settings.write('mods', settings.mods);

        this.emit('itemReady' as SteamCmdEvents);

        // ToDo: Add multiple item download without closing SteamCMD
        // ToDo: If first time installed, update server configuration to start mod
        // ToDo: Server mod support
        // ToDo: Optional mod support (only add keys)
    }
}

export type SteamCmdEvents = 'steamGuardRequired' |
    'steamGuardSent' |
    'loggingIn' |
    'loggedIn' |
    'itemComparingTimestamp' |
    'itemTimestampEqual' |
    'steamDownloaded' |
    'itemCopying' |
    'itemComparing' |
    'itemNotUpdated' |
    'itemUpdatingKeys' |
    'itemReady';
