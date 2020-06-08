import { flags as flag } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';
import { prompt } from 'inquirer';
import Command from '../../command';
import Config from '../../config';
import { EModType } from '../../enums/eModType';
import { nonInteractive } from '../../flags';
import Mod from '../../mod';
import SteamApi from '../../steam/steamApi';

import ora = require('ora');

export default class AddCommand extends Command {
    public static description = 'Adds Steam Workshop items to the configuration files (does not download them).';
    public static examples = [
        'magma add 723217262 --type client',
        'magma add 450814997 723217262 713709341 --type all client server',
    ];
    public static strict = false;
    public static args = [{ description: 'Steam Workshop item IDs.', name: 'ids', required: true }] as IArg[];
    public static flags = {
        nonInteractive,
        type: flag.string({
            char: 't',
            default: 'all',
            multiple: true,
            options: ['all', 'client', 'server'],
        }),
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
        Config.ensureIsLatestVersion();
    }

    public async run(): Promise<void> {
        const { argv, flags } = this.parse(AddCommand);
        const steamIds = argv.map(arg => parseInt(arg, 10));

        const configMods = Config.get('mods');
        const spinner = ora();

        // Get info from API
        const mods = [];
        const types: (keyof typeof EModType)[] = flags.type as any;

        for (const [index, steamId] of steamIds.entries()) {
            let type: EModType | undefined = EModType[types[index]];

            if (type === undefined) {
                if (flags.nonInteractive) {
                    throw new Error(`Mod (id: ${steamId}) was not given a type. Did you enter the type with --type?`);
                }

                type = await this.promptForType(steamId, spinner);
            }

            if (configMods.find(mod => mod.steamId === steamId) === undefined) {
                mods.push({ id: Mod.generateModId(), steamId, type });
            }
        }

        if (mods.length === 0) {
            console.log('The given mods have already been added to the configuration file.');
        } else {
            spinner.start('Fetching Steam API data and generating mod data');
            const fetchedMods = await Mod.generateModsFromApi(mods);
            spinner.succeed();

            // Add to config
            configMods.push(...fetchedMods);

            Config.set('mods', configMods);
        }
    }

    private async promptForType(id: number, spinner: ora.Ora): Promise<EModType> {
        const choices = ['Required for all', 'Client-side only', 'Server-side only'];

        spinner.start(`Fetching Steam API data for ${id}`);
        const name = (await SteamApi.getPublishedItem(id)).title;
        spinner.succeed();

        const response: { type: string } = await prompt({
            choices,
            message: `What type of mod is ${name}?`,
            name: 'type',
            type: 'list',
        });

        return choices.indexOf(response.type);
    }
}
