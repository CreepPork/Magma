import { flags } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Command from '../command';
import Crypto from '../crypto';
import Mod from '../mod';
import Settings from '../settings';
import SteamCmd, { SteamCmdEvents } from '../steamcmd';

import ora from 'ora';

export default class Download extends Command {
    public static description = 'Downloads a Steam Workshop item.';

    public static args = [
        {
            description: 'Steam Workshop item ID. Can be found in the URL.',
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
        const { args, flags } = this.parse(Download);
        const itemId = parseInt((args as { itemId: string }).itemId, 10);

        const credentials = Settings.get('steamCredentials');
        const cmd = new SteamCmd(credentials.username, new Crypto().decrypt(credentials.password));

        const spinner = ora('Fetching information about the item').start();
        const mod = await Mod.generateModFromId(
            flags.gameAppId ? flags.gameAppId : Settings.get('server').gameAppId,
            itemId,
        );
        spinner.succeed();

        cmd.on('itemComparingTimestamp' as SteamCmdEvents, () => {
            if (flags.force) {
                spinner.start('Refreshing time updated timestamp');
            } else {
                spinner.start('Comparing time updated timestamps');
            }
        });

        cmd.on('itemTimestampEqual' as SteamCmdEvents, () => {
            spinner.info('Time updated timestamps are equal, exiting');
        });

        cmd.on('loggingIn' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Logging in');
        });

        cmd.on('loggedIn' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Downloading item');
        });

        cmd.on('steamDownloaded' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Processing item');
        });

        cmd.on('itemCopying' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Copying item');
        });

        cmd.on('itemComparing' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Comparing signatures and updating mod data');
        });

        cmd.on('itemNotUpdated' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.info('Nothing new, did not update mod files');
        });

        cmd.on('itemUpdatingKeys' as SteamCmdEvents, () => {
            const message = 'Updating mod keys';

            if (spinner.isSpinning) {
                spinner.succeed();
                spinner.start(message);
            } else {
                spinner.start(message);
            }
        });

        cmd.on('itemReady' as SteamCmdEvents, () => {
            spinner.succeed();
        });

        spinner.start('Logging in');
        await cmd.downloadWorkshopItem(mod, flags.force);
    }
}
