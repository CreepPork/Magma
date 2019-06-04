import { flags } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Command from '../command';
import Crypto from '../crypto';
import Mod from '../mod';
import Settings from '../settings';
import SteamCmd, { SteamCmdEvents } from '../steamcmd';

import ora from 'ora';

export default class DownloadMod extends Command {
    public static description = 'Downloads a Steam Workshop item.';
    public static aliases = [
        'download',
    ];

    public static args = [
        {
            description: 'Steam Workshop item ID. Can be found in the URL.',
            name: 'itemId',
            required: true,
        },
    ] as IArg[];

    public static flags = {
        workshopId: flags.integer({ char: 'g' }),
    };

    public async run() {
        this.checkIfInitialized();
        // tslint:disable-next-line: no-shadowed-variable
        const { args, flags } = this.parse(DownloadMod);
        const itemId = parseInt((args as { itemId: string }).itemId, 10);

        const credentials = Settings.get('steamCredentials');
        const cmd = new SteamCmd(credentials.username, new Crypto().decrypt(credentials.password));

        const spinner = ora('Fetching information about the item').start();
        const mod = await Mod.generateModFromId(
            flags.workshopId ? flags.workshopId : Settings.get('server').gameAppId,
            itemId,
        );
        spinner.succeed();

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
            spinner.info('Nothing new, did not update');
        });

        cmd.on('itemReady' as SteamCmdEvents, () => {
            if (spinner.isSpinning) {
                spinner.succeed();
            }
        });

        spinner.start('Logging in');
        await cmd.downloadWorkshopItem(mod);
    }
}
