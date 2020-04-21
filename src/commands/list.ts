import Command from '@oclif/command';
import Config from '../config';

import { EModType } from '../enums/eModType';

import Table = require('cli-table');
import Time from '../time';
import SteamApi from '../steam/steamApi';
import Mod from '../mod';

import * as chalk from 'chalk';
import * as _ from 'lodash';

export default class ListCommand extends Command {
    public static description = 'Lists all mods that have been added or installed by Magma.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        let mods = Config.get('mods');
        mods = _.sortBy(mods, mod => mod.name);

        if (mods.length === 0) {
            console.log('No mods were found.');

            return;
        }

        const table = new Table({
            head: ['ID', 'Steam ID', 'Name ↓', 'Type', 'Status', 'Up-To-Date', 'Updated At', 'Keys'],
        });

        const apiMods = await SteamApi.getPublishedItems(Mod.filterSteamMods(mods).map(mod => mod.steamId));

        for (const mod of mods) {
            if (mod.isLocal) {
                table.push([
                    mod.id,
                    chalk.yellow('None'),
                    mod.name,
                    this.getModType(mod.type),
                    mod.isActive ? 'Activated' : chalk.yellow('Deactivated'),
                    chalk.yellow('Local mod'),
                    mod.updatedAt ? Time.epochToDate(mod.updatedAt).toUTCString() : 'Never',
                    mod.keys?.length === 0 ? chalk.yellow(0) : mod.keys?.length,
                ]);
            } else {
                const apiMod = apiMods[apiMods.findIndex(m => m.publishedfileid === `${mod.steamId}`)];

                table.push([
                    mod.id,
                    mod.steamId,
                    mod.name,
                    this.getModType(mod.type),
                    mod.isActive ? 'Activated' : chalk.yellow('Deactivated'),
                    apiMod.time_updated === mod.updatedAt ? 'Yes' : chalk.redBright.bold('No'),
                    mod.updatedAt ? Time.epochToDate(mod.updatedAt).toUTCString() : 'Never',
                    mod.keys?.length === 0 ? chalk.yellow(0) : mod.keys?.length,
                ]);
            }
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
