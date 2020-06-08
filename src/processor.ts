import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import Config from './config';
import { EModType } from './enums/eModType';
import Filesystem from './filesystem';
import IMod from './interfaces/iMod';
import Mod from './mod';


export default class Processor {
    public static renameModsToLower(mods: IMod[]): void {
        // As only Linux we need to rename mods to lowercase, we can ignore this method for Windows
        if (process.platform === 'win32') { return; }

        for (const mod of mods) {
            Filesystem.renameContentsToLowercase(Mod.getInstalledPath(mod));
        }
    }

    public static updateKeys(mods: IMod[]): IMod[] {
        const serverPath = Config.get('serverPath');
        fs.mkdirpSync(path.join(serverPath, 'keys'));

        for (const mod of mods) {
            // If keys already exist, then remove them from disk
            this.removeKeysFromMod(mod);
            mod.keys = [];

            // Find mod dir
            const workshopDir = Mod.getInstalledPath(mod);

            // Find keys
            const keys = Filesystem.findFilesWithExtension(workshopDir, '.bikey');

            // Move keys to /keys
            for (const key of keys) {
                const keyName = Filesystem.getFilename(key);
                const keyPath = path.join(serverPath, 'keys', keyName);

                // Don't copy duplicate keys
                if (mod.keys.indexOf(keyPath) === -1) {
                    fs.copySync(key, keyPath);
                    mod.keys.push(keyPath);
                }
            }
        }

        return mods;
    }

    public static removeKeysFromMod(mod: IMod): void {
        if (mod.keys) {
            for (const key of mod.keys) {
                if (fs.existsSync(key)) {
                    fs.removeSync(key);
                }
            }
        }
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

            const workshopDir = Mod.getInstalledPath(mod);

            const a3ModDir = path.join(serverPath, modDir);
            fs.symlinkSync(workshopDir, path.join(a3ModDir, `@${_.snakeCase(mod.name)}`));
        }
    }

    public static unlinkMod(mod: IMod): void {
        if (mod.type !== EModType.client) {
            const linkPath = path.join(
                Config.get('serverPath'),
                mod.type === EModType.all ? 'mods' : 'servermods',
                `@${_.snakeCase(mod.name)}`,
            );

            if (fs.existsSync(linkPath)) {
                fs.removeSync(linkPath);
            }
        }
    }

    public static pruneWorkshopContents(mod: IMod): void {
        const steamPath = Mod.getInstalledPath(mod);

        if (fs.existsSync(steamPath)) {
            fs.removeSync(steamPath);
        }
    }

    public static updateServerConfigFile(mods: IMod[]): void {
        if (process.platform === 'win32') { return; }

        const requiredMods = mods.filter(mod => mod.type === EModType.all && mod.isActive === true);
        const serverMods = mods.filter(mod => mod.type === EModType.server && mod.isActive === true);

        const serverConfigPath = Config.get('linuxGsm');

        if (!serverConfigPath) { return; }

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

        let requiredModStringAdded = false;
        let serverModStringAdded = false;

        for (const [index, line] of configText.entries()) {
            // If the line is commented out or empty, we ignore it
            if (line.charAt(0) === '#' || line === '') { continue; }

            if (line.startsWith('mods=')) {
                configText[index] = requiredModString;
                requiredModStringAdded = true;
            } else if (line.startsWith('servermods=')) {
                configText[index] = serverModString;
                serverModStringAdded = true;
            }
        }

        // If mods= or servermods= is not present then we add them
        if (!requiredModStringAdded) {
            configText.push(requiredModString);
        }

        if (!serverModStringAdded) {
            configText.push(serverModString);
        }

        fs.writeFileSync(serverConfigPath, configText.join('\n'));
    }
}
