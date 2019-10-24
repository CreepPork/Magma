import * as _ from 'lodash';

import Command from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Config from '../config';
import { nonInteractive } from '../flags';
import Insurers from '../insurers';
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

        // Get only those mods that are activated
        const mods = Config.get('mods');
        const filteredMods = mods.filter(mod => mod.isActive === false);

        if (filteredMods.length === 0) {
            console.log('There are no mods to activate.');

            return;
        }

        if (ids.length === 0) {
            ids = await Insurers.ensureValidIds(
                filteredMods, flags.nonInteractive, 'What mods would you like to activate?'
            );
        }

        for (const id of ids) {
            const mod = mods[mods.findIndex(m => m.id === id)];

            // If user gave a non-existant mod id
            if (mod === undefined) { continue; }

            // Remove mod keys
            Processor.updateKeys([mod]);

            // Remove symlink
            Processor.linkMods([mod]);

            // Remove from config
            mod.isActive = true;
        }

        Processor.updateServerConfigFile(mods);

        Config.set('mods', mods);
    }
}
