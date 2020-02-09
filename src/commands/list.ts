import Command from '@oclif/command';
import Config from '../config';

import { EModType } from '../enums/eModType';

import Table = require('cli-table');
import Time from '../time';
import SteamApi from '../steam/steamApi';

import * as chalk from 'chalk';
import * as _ from 'lodash';

export default class ListCommand extends Command {
    public static description = 'Lists all mods that have been added or installed by Magma.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const table = new Table({
            head: ['ID', 'Name', 'Type', 'Status', 'Up-To-Date', 'Updated At', 'Key Count'],
        });

        let mods = Config.get('mods');
        mods = _.sortBy(mods, mod => mod.name);

        if (mods.length === 0) {
            console.log('No mods were found.');

            return;
        }

        const apiMods = await SteamApi.getPublishedItems(...mods.map(mod => mod.id));

        for (const [index, mod] of mods.entries()) {
            table.push([
                mod.id, mod.name, this.getModType(mod.type), mod.isActive ? 'Activated' : chalk.yellow('Deactivated'),
                apiMods[index].time_updated === mod.updatedAt ? 'Yes' : chalk.redBright.bold('No'),
                mod.updatedAt ? Time.epochToDate(mod.updatedAt).toUTCString() : 'Never',
                mod.keys ? mod.keys.length : 0,
            ]);
        }

        console.log(table.toString());
    }

    private getModType(type: EModType): string {
        switch (type) {
            case EModType.all:
                return 'Required';
            case EModType.client:
                return 'Client-side';
            case EModType.server:
                return 'Server-side';
            default:
                return 'Unknown';
        }
    }
}
