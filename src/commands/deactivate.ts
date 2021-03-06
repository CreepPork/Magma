import { IArg } from '@oclif/parser/lib/args';
import Command from '../command';
import Config from '../config';
import { nonInteractive } from '../flags';
import Insurer from '../insurer';
import ISteamMod from '../interfaces/iSteamMod';
import Mod from '../mod';
import Processor from '../processor';

export default class DeactivateCommand extends Command {
    public static description = 'Deactivates mods by removing their symlinks and keys.';
    public static examples = [
        'magma deactivate',
        'magma deactivate 723217262',
        'magma deactivate 450814997 723217262 713709341',
    ];
    public static strict = false;
    public static args = [{ description: 'Steam Workshop item IDs.', name: 'id' }] as IArg[];
    public static flags = {
        nonInteractive,
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
        Config.ensureIsLatestVersion();
    }

    public async run(): Promise<void> {
        const { argv, flags } = this.parse(DeactivateCommand);
        let steamIds = argv.map(arg => parseInt(arg, 10));

        // Get only those mods that are activated
        const mods = Config.get('mods');
        const filteredMods: ISteamMod[] = Mod.filterSteamMods(mods) as ISteamMod[];

        if (filteredMods.length === 0) {
            console.log('There are no mods to deactivate.');

            return;
        }

        if (steamIds.length === 0) {
            const insurer = new Insurer(flags.nonInteractive);

            steamIds = await insurer.ensureValidIds(filteredMods, 'What mods would you like to deactivate?');
        }

        for (const steamId of steamIds) {
            const mod = mods[mods.findIndex(m => m.steamId === steamId)];

            // If user gave a non-existant mod id
            if (mod === undefined) { continue; }

            // Remove mod keys
            Processor.removeKeysFromMod(mod);
            mod.keys = undefined;

            // Remove symlink
            Processor.unlinkMod(mod);

            // Remove from config
            mod.isActive = false;
        }

        Processor.updateServerConfigFile(mods);

        Config.set('mods', mods);
    }
}
