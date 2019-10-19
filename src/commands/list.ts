import Command from '@oclif/command';
import Config from '../config';

import { EModType } from '../enums/eModType';

import Table = require('cli-table');
import Time from '../time';

export default class ListCommand extends Command {
    public static description = 'Lists all mods that have been added or installed by Magma.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const table = new Table({
            head: ['ID', 'Name', 'Type', 'Updated At', 'Key Count'],
        });

        const mods = Config.get('mods');

        if (mods.length === 0) {
            console.log('No mods were found.');

            return;
        }

        for (const mod of mods) {
            table.push([
                mod.id, mod.name, this.getModType(mod.type),
                mod.updatedAt ? Time.epochToDate(mod.updatedAt).toUTCString() : 'Not Updated',
                mod.keys ? mod.keys.length : 0,
            ]);
        }

        console.log(table.toString());
    }

    private getModType(type: EModType): string {
        switch (type) {
            case EModType.forAll:
                return 'Required';
            case EModType.clientSide:
                return 'Client-side';
            case EModType.serverSide:
                return 'Server-side';
            default:
                return 'Unknown';
        }
    }
}
