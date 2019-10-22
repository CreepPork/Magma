import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import Command from '@oclif/command';

import Config from '../config';
import CServer from '../constants/server';
import { EModType } from '../enums/eModType';
import Filesystem from '../filesystem';
import IMod from '../interfaces/iMod';
import Mod from '../mod';
import SteamCmd from '../steam/steamCmd';

export default class InstallCommand extends Command {
    public static description = 'Downloads and installs mods that have not been previously installed.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        // Fetch mods that haven't been installed, from config
        let mods = Config.get('mods').filter(mod => mod.updatedAt === undefined);

        if (mods.length === 0) { return; }

        // Download mods
        await SteamCmd.download(...mods.map(mod => mod.id));

        // Fetch updatedAt property
        mods = await Mod.getModUpdatedAtFromApi(mods);

        // Move mods + servermods
        const requiredMods = mods.filter(mod => mod.type === EModType.all);
        const serverMods = mods.filter(mod => mod.type === EModType.server);

        // Rename all to lowercase
        this.renameModsToLower(mods);

        this.moveMods(mods);

        // Update keys
        mods = this.updateKeys(mods);

        // Update LinuxGSM config
        this.updateServerConfig(requiredMods, serverMods);

        // Update config file to add updatedAt
        this.updateConfigFile(mods);
    }

    private getWorkshopModPath(id: number): string {
        return path.join(
            Config.get('serverPath'), `steamapps/workshop/content/${CServer.id}/${id}`,
        );
    }

    private renameModsToLower(mods: IMod[]): void {
        // As only Linux we need to rename mods to lowercase, we can ignore this method for Windows
        if (process.platform === 'win32') { return; }

        for (const mod of mods) {
            Filesystem.renameContentsToLowercase(this.getWorkshopModPath(mod.id));
        }
    }

    private moveMods(mods: IMod[]): void {
        const serverPath = Config.get('serverPath');

        fs.mkdirpSync(path.join(serverPath, 'mods'));
        fs.mkdirpSync(path.join(serverPath, 'servermods'));

        for (const mod of mods) {
            // We don't want to copy client-side mods
            if (mod.type === EModType.client) { continue; }

            const modDir = mod.type === EModType.all
            ? 'mods'
            : 'servermods';

            const workshopDir = this.getWorkshopModPath(mod.id);

            const a3ModDir = path.join(serverPath, modDir);
            fs.symlinkSync(workshopDir, path.join(a3ModDir, `@${_.snakeCase(mod.name)}`));
        }
    }

    private updateKeys(mods: IMod[]): IMod[] {
        const serverPath = Config.get('serverPath');
        fs.mkdirpSync(path.join(serverPath, 'keys'));

        for (const mod of mods) {
            mod.keys = [];

            // Find mod dir
            const workshopDir = this.getWorkshopModPath(mod.id);

            // Find keys
            const keys = Filesystem.findFilesWithExtension(workshopDir, '.bikey');

            // Move keys to /keys
            for (const key of keys) {
                const keyName = Filesystem.getFilename(key);

                fs.copySync(key, path.join(serverPath, 'keys', keyName));

                mod.keys.push(
                    path.join(serverPath, 'keys', keyName),
                );
            }
        }

        return mods;
    }

    private updateServerConfig(requiredMods: IMod[], serverMods: IMod[]): void {
        if (process.platform === 'win32') { return; }

        const serverConfigPath = Config.get('linuxGsm');

        if (! serverConfigPath) { return; }

        let requiredModString = 'mods="';
        let serverModString = 'servermods="';

        for (const mod of requiredMods) {
            requiredModString += `mods/@${_.snakeCase(mod.name)}\\;`;
        }

        for (const mod of serverMods) {
            serverModString += `servermods/@${_.snakeCase(mod.name)}\\;`;
        }

        // Close strings
        requiredModString += '"';
        serverModString += '"';

        // Read config file and transform it into a line array
        const configText = fs.readFileSync(serverConfigPath).toString().replace(/[\r]/g, '').trim().split('\n');

        for (const [index, line] of configText.entries()) {
            // If the line is commented out, we ignore it (or is an empty line)
            if (line.charAt(0) === '#' || line === '') { continue; }

            if (line.startsWith('mods=')) {
                configText[index] = requiredModString;
            } else if (line.startsWith('servermods=')) {
                configText[index] = serverModString;
            }
        }

        fs.writeFileSync(serverConfigPath, configText.join('\n'));
    }

    private updateConfigFile(mods: IMod[]): void {
        const installedMods = Config.get('mods').filter(mod => mod.updatedAt !== undefined);

        const mergedMods = _.merge(installedMods, mods);

        Config.set('mods', mergedMods);
    }
}
