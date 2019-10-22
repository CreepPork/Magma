import * as _ from 'lodash';

import Command from '@oclif/command';

import Config from '../config';
import { EModType } from '../enums/eModType';
import IMod from '../interfaces/iMod';
import Mod from '../mod';
import Processor from '../processor';
import SteamCmd from '../steam/steamCmd';

export default class InstallCommand extends Command {
    public static description = 'Downloads and installs mods that have not been previously installed.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        // Fetch mods that haven't been installed, from config
        let mods = Config.get('mods').filter(mod => mod.updatedAt === undefined);

        // If all mods have been already installed, exit
        if (mods.length === 0) { return; }

        await SteamCmd.download(...mods.map(mod => mod.id));

        // Fetch updatedAt property
        mods = await Mod.getModUpdatedAtFromApi(mods);

        const requiredMods = mods.filter(mod => mod.type === EModType.all);
        const serverMods = mods.filter(mod => mod.type === EModType.server);

        // Rename all mod contents to lowercase
        Processor.renameModsToLower(mods);

        // Create a symlink to the SW mod files
        Processor.linkMods(mods);

        mods = Processor.updateKeys(mods);

        // Update LinuxGSM config
        Processor.updateServerConfigFile(requiredMods, serverMods);

        this.updateConfigFile(mods);
    }

    private updateConfigFile(mods: IMod[]): void {
        const installedMods = Config.get('mods').filter(mod => mod.updatedAt !== undefined);

        const mergedMods = _.merge(installedMods, mods);

        Config.set('mods', mergedMods);
    }
}
