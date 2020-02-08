import * as _ from 'lodash';

import Command from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Config from '../config';
import { nonInteractive } from '../flags';
import Insurer from '../insurer';
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
    }

    public async run(): Promise<void> {
        const { argv, flags } = this.parse(DeactivateCommand);
        let ids = argv.map(arg => parseInt(arg, 10));

        // Get only those mods that are activated
        const mods = Config.get('mods');
        const filteredMods = mods.filter(mod => mod.isActive === true);

        if (filteredMods.length === 0) {
            console.log('There are no mods to deactivate.');

            return;
        }

        if (ids.length === 0) {
            const insurer = new Insurer(flags.nonInteractive);

            ids = await insurer.ensureValidIds(filteredMods, 'What mods would you like to deactivate?');
        }

        for (const id of ids) {
            const mod = mods[mods.findIndex(m => m.id === id)];

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
