import { flags } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Command from '../command';
import Crypto from '../crypto';
import Mod from '../mod';
import Settings from '../settings';
import SteamCmd from '../steam/cmd';

import * as _ from 'lodash';

import ora from 'ora';

export default class Download extends Command {
    public static description = 'Downloads Steam Workshop items, moves keys and updates mods.';
    public static examples = [
        'magma download 723217262',
        'magma download 450814997 723217262 713709341 -f',
        'magma download 430091721 -g 4000',
    ];

    public static strict = false;
    public static args = [
        {
            description: 'Steam Workshop item IDs. Chaining them will download all of them at once.',
            name: 'itemId',
            required: true,
        },
    ] as IArg[];

    public static flags = {
        force: flags.boolean({
            char: 'f',
            description: 'Ignores time updated timestamp from Steam Workshop.',
        }),
        gameAppId: flags.integer({
            char: 'g',
            description: 'Steam game app ID. Can be found at SteamDB or in the URL.',
        }),
    };

    public async run() {
        this.checkIfInitialized();
        // tslint:disable-next-line: no-shadowed-variable
        const { argv, flags } = this.parse(Download);

        const appId = flags.gameAppId ? flags.gameAppId : Settings.get('server').gameAppId;
        const itemIds = argv.map(arg => parseInt(arg, 10));

        const mods = [];
        const spinner = ora('Fetching information about the items').start();
        for (const itemId of itemIds) {
            mods.push(await Mod.generateModFromId(appId, itemId, true));
        }
        spinner.succeed();

        const credentials = Settings.get('steamCredentials');
        const cmd = new SteamCmd(credentials.username, new Crypto().decrypt(credentials.password));

        if (mods.length === 1) {
            cmd.on('loggedIn', () => {
                spinner.succeed();
                spinner.start('Downloading item');
            });

            cmd.on('steamDownloaded', () => {
                spinner.succeed();
                spinner.start('Processing item');
            });

            cmd.on('itemCopying', () => {
                spinner.succeed();
                spinner.start('Copying item');
            });

            cmd.on('itemComparing', () => {
                spinner.succeed();
                spinner.start('Comparing signatures and updating mod data');
            });

            cmd.on('itemUpdatingKeys', () => {
                if (spinner.isSpinning) {
                    spinner.succeed();
                }

                spinner.start('Updating mod keys');
            });
        } else {
            cmd.on('loggedIn', () => {
                spinner.succeed();
                spinner.start('Processing your request');
            });
        }

        cmd.on('itemComparingTimestamp', (id: number, name: string) => {
            if (flags.force) {
                spinner.start(`Refreshing time updated timestamp for ${name} (${id})`);
            } else {
                spinner.start(`Comparing time updated timestamps for ${name} (${id})`);
            }
        });

        cmd.on('itemTimestampCompared', () => {
            spinner.succeed();
        });

        cmd.on('itemTimestampEqual', (id: number, name: string) => {
            spinner.info(`Time updated timestamps are equal, skipping ${name} (${id})`);
        });

        cmd.on('loggingIn', () => {
            spinner.start('Logging in');
        });

        cmd.on('allItemsReady', () => {
            if (spinner.isSpinning) {
                spinner.succeed();
            }
        });

        spinner.start('Logging in');
        await cmd.downloadMods(mods, flags.force);
    }
}
