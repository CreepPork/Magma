import Command from '@oclif/command';
import Config from '../config';
import IMod from '../interfaces/iMod';
import ISteamMod from '../interfaces/iSteamMod';
import Mod from '../mod';
import Processor from '../processor';
import SteamCmd from '../steam/steamCmd';

export default class InstallCommand extends Command {
    public static description = 'Downloads and installs mods that have not been previously installed.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
        Config.ensureIsLatestVersion();
    }

    public async run(): Promise<void> {
        // Fetch mods that haven't been installed, from config
        let mods = Config.get('mods').filter(mod => mod.updatedAt === undefined);

        // If all mods have been already installed, exit
        if (mods.length === 0) {
            console.log('All mods have been already installed/no mods are present.');

            return;
        }

        const localMods = this.installLocalMods(Mod.filterLocalMods(mods));
        const steamMods = await this.installSteamMods(Mod.filterSteamMods(mods));

        mods = localMods.concat(...steamMods);

        mods = Processor.updateKeys(mods);

        this.updateConfigFile(mods);

        // Update LinuxGSM config
        Processor.updateServerConfigFile(Config.get('mods'));
    }

    private installLocalMods(mods: IMod[]): IMod[] {
        if (mods.length === 0) { return []; }

        mods = Mod.getLocalModUpdatedAt(mods);

        Processor.renameModsToLower(mods);

        return mods;
    }

    private async installSteamMods(mods: ISteamMod[]): Promise<IMod[]> {
        if (mods.length === 0) { return []; }

        await SteamCmd.download(mods.map(mod => mod.steamId));

        // Fetch updatedAt property
        mods = await Mod.getModUpdatedAtFromApi(mods);

        // Rename all mod contents to lowercase
        Processor.renameModsToLower(mods);

        // Create a symlink to the SW mod files
        Processor.linkMods(mods);

        return mods;
    }

    private updateConfigFile(mods: IMod[]): void {
        const installedMods = Config.get('mods').filter(mod => mod.updatedAt !== undefined);

        installedMods.push(...mods);

        Config.set('mods', installedMods);
    }
}
