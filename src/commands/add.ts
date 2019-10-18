import Command from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';
import Config from '../config';

import ora = require('ora');
import Mod from '../mod';

export default class Add extends Command {
    public static description = 'Adds Steam Workshop items to the configuration files (does not download them).';
    public static examples = ['magma add 723217262', 'magma add 450814997 723217262 713709341'];
    public static strict = false;
    public static args = [{ description: 'Steam Workshop IDs.', name: 'ids', required: true }] as IArg[];

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const { argv } = this.parse(Add);
        const ids = argv.map(arg => parseInt(arg, 10));

        // Get info from API
        const mods = [];

        for (const id of ids) {
            // todo: think how to get type
            mods.push(await Mod.getModsFromApi({ id, type }));
        }

        // Add to config
    }
}
