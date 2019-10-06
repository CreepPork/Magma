import File from '../file';
import { IMod } from '../mod';
import Settings from '../settings';
import sleep from '../sleep';
import SteamApi from './api';

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
                        // If args is not empty then only one OK is returned for some reason
                        if (okTimes >= 2 || args.length > 0) {
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

    public async downloadWorkshopItem(mod: IMod) {
        await this.downloadWorkshopItems([mod]);
    }

    public async downloadWorkshopItems(mods: IMod[]) {
        if (mods.length === 0) { return; }

        const gameServerPath = Settings.get('gameServerPath');

        const args = [];

        // For some reason SteamCMD doesn't download correctly to the asked path
        if (process.platform === 'win32') {
            args.push(`+force_install_dir "${gameServerPath}"`);
        } else {
            args.push(`+force_install_dir ${gameServerPath}`);
        }

        mods.forEach(mod => {
            args.push(`+workshop_download_item ${mod.gameId} ${mod.itemId}`);
        });

        await this.login(args);

        this.emit('steamDownloaded');
    }

    public async downloadMods(mods: IMod[], forceUpdate?: boolean): Promise<void> {
        if (mods.length === 0) { return; }

        const gameServerPath = Settings.get('gameServerPath');
        const modDir = path.join(gameServerPath, 'mods');

        const allMods = Settings.get('mods');

        // Remove any mods that don't need to be processed
        let filteredMods = [];
        for (const mod of mods) {
            const timestamp = await this.compareTimestamps(mod, forceUpdate);

            if (timestamp) {
                mod.updatedAt = timestamp;
                filteredMods.push(mod);
            }
        }

        // Separate server and client side mods into their own arrays
        const serverSideMods = filteredMods.filter(mod => mod.isServerMod);
        const clientSideMods = filteredMods.filter(mod => mod.isClientSideMod);

        // All of them are in one filteredMods array so they are downloaded
        // Through the same instance of SteamCMD.
        await this.downloadWorkshopItems(filteredMods);

        // Take into account time to copy all files from steam downloading to steam workshop dir
        if (filteredMods.length > 0) {
            this.emit('waitingSteamCopy');
            for (const mod of filteredMods) {
                const dir = path.join(gameServerPath, `steamapps/workshop/downloads/${mod.gameId}/${mod.itemId}`);

                await this.awaitDownloadDirDestruction(dir);
            }
            this.emit('awaitedSteamCopy');
        }

        this.processServersideMod(serverSideMods);
        await this.processClientsideMod(clientSideMods);

        // Remove server and client side mods
        filteredMods = filteredMods.filter(mod => !mod.isServerMod && !mod.isClientSideMod);

        for (const mod of filteredMods) {
            const itemDir = path.join(gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

            if (! fs.existsSync(modDir)) {
                fs.mkdirsSync(modDir);
            }

            // @my_awesome_mod
            const dirName = `@${_.snakeCase(mod.name)}`;
            const modDownloadDir = path.join(modDir, dirName);

            this.updateFiles(itemDir, modDownloadDir);

            await this.updateKeys(mod, modDownloadDir);

            const modIndex = allMods.findIndex(el => el.itemId === mod.itemId);
            Object.assign(allMods[modIndex], mod);

            this.emit('itemReady');
        }

        // Write timestamps to config
        Settings.write('mods', mods);

        this.emit('allItemsReady');
    }

    private async awaitDownloadDirDestruction(downloadDir: string): Promise<void> {
        while (true) {
            // If downloadDir exists then await till it doesn't exist
            if (! fs.existsSync(downloadDir)) {
                break;
            }

            await sleep(500);
        }
    }

    private async processClientsideMod(mods: IMod[]) {
        if (mods.length === 0) { return; }

        const gameServerPath = Settings.get('gameServerPath');

        for (const mod of mods) {
            const itemDir = path.join(gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

            await this.updateKeys(mod, itemDir);

            this.emit('itemReady');
        }
    }

    private processServersideMod(mods: IMod[]) {
        if (mods.length === 0) { return; }

        const gameServerPath = Settings.get('gameServerPath');
        const modDir = path.join(gameServerPath, 'servermods');

        if (! fs.existsSync(modDir)) {
            fs.mkdirsSync(modDir);
        }

        for (const mod of mods) {
            const itemDir = path.join(gameServerPath, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

            // @my_awesome_mod
            const dirName = `@${_.snakeCase(mod.name)}`;
            const modDownloadDir = path.join(modDir, dirName);

            this.updateFiles(itemDir, modDownloadDir);

            this.emit('itemReady');
        }
    }

    private async compareTimestamps(mod: IMod, forceUpdate?: boolean): Promise<number | undefined> {
        this.emit('itemComparingTimestamp', mod.itemId, mod.name);

        const data = await SteamApi.getPublishedItemDetails(mod.itemId);

        const updatedAt = data.response.publishedfiledetails[0].time_updated;

        if (mod.updatedAt && ! forceUpdate) {
            if (updatedAt === mod.updatedAt) {
                this.emit('itemTimestampEqual', mod.itemId, mod.name);

                return;
            }
        }

        this.emit('itemTimestampCompared');

        return updatedAt;
    }

    private updateFiles(itemDir: string, modDownloadDir: string) {
        // Required for Linux servers, otherwise mods don't work
        // But then on mod update it has to be cleaned up, otherwise ENOTEMPTY error is thrown
        // Because two directories are created (lower, sentence case) which then try to merge resulting in a error.
        this.everythingToLowercase(itemDir);

        if (! fs.existsSync(modDownloadDir)) {
            this.emit('itemCopying');

            fs.copySync(itemDir, modDownloadDir);
        } else {
            this.emit('itemComparing');

            const changedFiles = File.compareFiles(itemDir, modDownloadDir);

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

    private everythingToLowercase(sourceDir: string) {
        const dirs = File.getAllDirectoriesRecursively(sourceDir);

        for (const [i, dir] of dirs.entries()) {
            if (fs.existsSync(dir)) {
                fs.renameSync(dir, path.join(dir, '..', File.getFilename(dir).toLowerCase()));
            } else {
                const newDirs = File.getAllDirectoriesRecursively(sourceDir);
                const updatedDir = newDirs[i];

                fs.renameSync(updatedDir, path.join(updatedDir, '..', File.getFilename(updatedDir).toLowerCase()));
            }
        }

        const files = File.getAllFilesRecursively(sourceDir);

        for (const file of files) {
            fs.renameSync(file, path.join(file, '..', File.getFilename(file).toLowerCase()));
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
