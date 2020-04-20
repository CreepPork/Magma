import * as _ from 'lodash';

import Command from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Config from '../config';
import { nonInteractive } from '../flags';
import Insurer from '../insurer';
import Processor from '../processor';

export default class ActivateCommand extends Command {
    public static description = 'Activates mods by adding their symlinks and keys back.';
    public static examples = [
        'magma activate',
        'magma activate 723217262',
        'magma activate 450814997 723217262 713709341',
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
        const { argv, flags } = this.parse(ActivateCommand);
        let ids = argv.map(arg => parseInt(arg, 10));

        // Get only those mods that are deactivated
        const mods = Config.get('mods');
        const filteredMods = mods.filter(mod => mod.isActive === false);

        if (filteredMods.length === 0) {
            console.log('There are no mods to activate.');

            return;
        }

        if (ids.length === 0) {
            const insurer = new Insurer(flags.nonInteractive);

            ids = await insurer.ensureValidIds(filteredMods, 'What mods would you like to activate?');
        }

        for (const id of ids) {
            const mod = mods[mods.findIndex(m => m.id === id)];

            // If user gave a non-existant mod id
            if (mod === undefined) { continue; }

            // Add mod keys
            Processor.updateKeys([mod]);

            // Add symlink
            Processor.linkMods([mod]);

            // Add to config
            mod.isActive = true;
        }

        Processor.updateServerConfigFile(mods);

        Config.set('mods', mods);
    }
}
