import File from './file';
import { IMod } from './popularMods';
import Settings from './settings';

import * as execa from 'execa';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

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

    public async downloadWorkshopItem(mod: IMod): Promise<void> {
        const settings = Settings.getAll();
        const modDir = path.join(settings.gameServerPath, 'mods');
        const itemDir = path.join(settings.gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

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


        this.emit('itemReady' as SteamCmdEvents);

        // ToDo: Find and update keys
        // ToDo: Add multiple item download without closing SteamCMD
        // ToDo: Check Steam API time_updated epoch timestamp if to run this method
        // ToDo: If first time installed, update server configuration to start mod
        // ToDo: Server mod support
        // ToDo: Optional mod support (only add keys)
    }
}

export type SteamCmdEvents = 'steamGuardRequired'|
    'steamGuardSent' |
    'loggedIn' |
    'steamDownloaded' |
    'itemCopying' |
    'itemComparing' |
    'itemNotUpdated' |
    'itemReady';
