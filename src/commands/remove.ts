import { IArg } from '@oclif/parser/lib/args';
import * as _ from 'lodash';
import Command from '../command';
import Config from '../config';
import { nonInteractive } from '../flags';
import Insurer from '../insurer';
import Processor from '../processor';

export default class RemoveCommand extends Command {
    public static description = 'Removes mod files from disk.';
    public static examples = [
        'magma remove',
        'magma remove 1',
        'magma remove 14 3 9',
    ];
    public static strict = false;
    public static aliases = ['uninstall'];
    public static args = [{ description: 'Item IDs.', name: 'id' }] as IArg[];
    public static flags = {
        nonInteractive,
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
        Config.ensureIsLatestVersion();
    }

    public async run(): Promise<void> {
        const { argv, flags } = this.parse(RemoveCommand);
        let ids = argv.map(arg => parseInt(arg, 10));

        const mods = Config.get('mods');

        if (mods.length === 0) {
            console.log('There are no mods to remove.');

            return;
        }

        if (ids.length === 0) {
            const insurer = new Insurer(flags.nonInteractive);

            ids = await insurer.ensureValidIds(mods, 'What mods would you like to remove?');
        }

        // Remove Steam items
        for (const id of ids) {
            const mod = mods[mods.findIndex(m => m.id === id)];

            // If user gave a non-existant mod id
            if (mod === undefined) {
                console.warn(`The given mod with ID of ${id} hasn't been found.\nDid you enter the item ID and not the Steam ID?`)

                continue;
            }

            // Remove mod keys
            Processor.removeKeysFromMod(mod);

            // Remove mod
            Processor.unlinkMod(mod);

            // Remove workshop mod contents
            if (mod.steamId !== undefined) {
                Processor.pruneWorkshopContents(mod);
            }

            // Remove from config
            _.remove(mods, m => m.id === id);
        }

        Processor.updateServerConfigFile(mods);

        Config.set('mods', mods);
    }
}
