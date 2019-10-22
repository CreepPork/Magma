import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import Config from './config';
import CServer from './constants/server';
import { EModType } from './enums/eModType';
import Filesystem from './filesystem';
import IMod from './interfaces/iMod';

export default class Processor {
    public static getWorkshopModPath(id: number): string {
        return path.join(
            Config.get('serverPath'), `steamapps/workshop/content/${CServer.id}/${id}`,
        );
    }

    public static renameModsToLower(mods: IMod[]): void {
        // As only Linux we need to rename mods to lowercase, we can ignore this method for Windows
        if (process.platform === 'win32') { return; }

        for (const mod of mods) {
            Filesystem.renameContentsToLowercase(this.getWorkshopModPath(mod.id));
        }
    }

    public static updateKeys(mods: IMod[]): IMod[] {
        const serverPath = Config.get('serverPath');
        fs.mkdirpSync(path.join(serverPath, 'keys'));

        for (const mod of mods) {
            // If keys already exist, then remove them from disk
            if (mod.keys && mod.keys.length > 0) {
                for (const key of mod.keys) {
                    if (fs.existsSync(key)) {
                        fs.removeSync(key);
                    }
                }
            }

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

    public static linkMods(mods: IMod[]): void {
        const serverPath = Config.get('serverPath');

        fs.mkdirpSync(path.join(serverPath, 'mods'));
        fs.mkdirpSync(path.join(serverPath, 'servermods'));

        for (const mod of mods) {
            // We don't want to symlink client-side mods
            if (mod.type === EModType.client) { continue; }

            const modDir = mod.type === EModType.all
                ? 'mods'
                : 'servermods';

            const workshopDir = this.getWorkshopModPath(mod.id);

            const a3ModDir = path.join(serverPath, modDir);
            fs.symlinkSync(workshopDir, path.join(a3ModDir, `@${_.snakeCase(mod.name)}`));
        }
    }

    public static updateServerConfigFile(requiredMods: IMod[], serverMods: IMod[]): void {
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
}
