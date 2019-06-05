import File from '../file';
import { IMod } from '../mod';
import Settings from '../settings';

import * as execa from 'execa';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import SteamApi from './api';

export default class SteamCmd extends EventEmitter {
    private username: string;
    private password: string;

    private cmdPath: string;

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

            this.emit('loggingIn');

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
                        reject(new Error(text.split('\n')[0]));
                    }

                    if (text.includes('OK')) {
                        okTimes++;

                        // It outputs OK twice but not the full string
                        // One is when logged in and other when profile info has been downloaded
                        if (okTimes >= 2) {
                            clearTimeout(timeout);

                            loggedIn = true;
                            this.emit('loggedIn');
                        }
                    }
                } else {
                    if (text.includes('Logging in user') || text.includes('Connecting anonymously to')) {
                        hasTriedToLogin = true;

                        // As the Steam Guard code doesn't get outputed to stdout we do a wait (can be risky)
                        timeout = setTimeout(() => {
                            this.on('steamGuardSent', (code: string) => {
                                stdin.write(`${code}\n`);
                            });
                            this.emit('steamGuardRequired');
                        }, 10 * 1000);
                    }
                }
            });

            cmd.on('exit', () => {
                if (loggedIn) {
                    resolve();
                } else {
                    clearTimeout(timeout);
                    reject(new Error('Process closed and we did not log in.'));
                }
            });
        });
    }

    public async downloadWorkshopItem(gameId: number, itemId: number): Promise<void> {
        const gameServerPath = Settings.get('gameServerPath');

        const args = [];

        args.push(`+force_install_dir ${gameServerPath}`);
        args.push(`+workshop_download_item ${gameId} ${itemId}`);

        await this.login(args);

        this.emit('steamDownloaded');
    }

    public async downloadMod(mod: IMod, forceUpdate?: boolean): Promise<void> {
        const gameServerPath = Settings.get('gameServerPath');
        const modDir = path.join(gameServerPath, 'mods');
        const itemDir = path.join(gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

        const updatedAt = await this.compareTimestamps(mod, forceUpdate);

        if (! updatedAt) {
            return;
        }

        if (! fs.existsSync(modDir)) {
            fs.mkdirsSync(modDir);
        }

        await this.downloadWorkshopItem(mod.gameId, mod.itemId);

        // @my_awesome_mod
        const dirName = `@${_.snakeCase(mod.name)}`;
        const modDownloadDir = path.join(modDir, dirName);

        await this.updateFiles(itemDir, modDownloadDir);

        await this.updateKeys(mod, modDownloadDir);

        this.emit('itemReady');

        // ToDo: Add multiple item download without closing SteamCMD
        // ToDo: If first time installed, update server configuration to start mod
        // ToDo: Server mod support
    }

    public async downloadOptionalMod(mod: IMod, forceUpdate?: boolean) {
        const updatedAt = await this.compareTimestamps(mod, forceUpdate);

        if (! updatedAt) {
            return;
        }

        const gameServerPath = Settings.get('gameServerPath');
        const itemDir = path.join(gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

        await this.downloadWorkshopItem(mod.gameId, mod.itemId);

        await this.updateKeys(mod, itemDir);

        this.emit('itemReady');
    }

    private async compareTimestamps(mod: IMod, forceUpdate?: boolean): Promise<number | undefined> {
        this.emit('itemComparingTimestamp');

        const data = await SteamApi.getPublishedItemDetails(mod.itemId);

        const updatedAt = data.response.publishedfiledetails[0].time_updated;

        if (mod.updatedAt && ! forceUpdate) {
            if (updatedAt === mod.updatedAt) {
                this.emit('itemTimestampEqual');

                return;
            }
        }

        return updatedAt;
    }

    private async updateFiles(itemDir: string, modDownloadDir: string) {
        if (! fs.existsSync(modDownloadDir)) {
            this.emit('itemCopying');

            fs.copySync(itemDir, modDownloadDir);
        } else {
            this.emit('itemComparing');

            const changedFiles = await File.compareFiles(itemDir, modDownloadDir);

            if (changedFiles.length === 0) {
                this.emit('itemNotUpdated');
            }

            changedFiles.forEach(file => {
                if (file.includes(modDownloadDir)) {
                    fs.unlinkSync(file);
                } else {
                    fs.copySync(file, path.join(modDownloadDir, path.relative(itemDir, file)));
                }
            });
        }
    }

    private async updateKeys(mod: IMod, downloadDir: string) {
        this.emit('itemUpdatingKeys');

        const gameServerPath = Settings.get('gameServerPath');
        const mods = Settings.get('mods');

        // Create keys dir if doesn't exist
        const keyDir = path.join(gameServerPath, 'keys');
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
        const keys = File.findFiles(downloadDir, '.bikey');

        // Copy keys
        keys.forEach(key => {
            fs.copyFile(key, path.join(keyDir, File.getFilename(key)));
        });

        mod.keys = keys.map(key => path.join(keyDir, File.getFilename(key)));

        // Update keys in settings
        const modIndex = mods.findIndex(el => el.itemId === mod.itemId);
        Object.assign(mods[modIndex], mod);

        Settings.write('mods', mods);
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
