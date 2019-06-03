import { IArg } from '@oclif/parser/lib/args';

import Command from '../command';
import Crypto from '../cypto';
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

    public async run() {
        this.checkIfInitialized();
        const { args } = this.parse(DownloadMod);
        const itemId = parseInt((args as { itemId: string }).itemId, 10);

        const credentials = Settings.get('steamCredentials');
        const cmd = new SteamCmd(credentials.username, new Crypto().decrypt(credentials.password));

        const spinner = ora('Fetching information about the item').start();
        const mod = await Mod.generateModFromId(Settings.get('server').gameAppId, itemId);
        spinner.succeed();

        cmd.on('loggedIn' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Downloading item');
        });

        cmd.on('steamDownloaded' as SteamCmdEvents, () => {
            spinner.succeed();
            spinner.start('Copying item');
        });

        cmd.on('itemReady' as SteamCmdEvents, () => {
            spinner.succeed();
        });

        spinner.start('Logging in');
        await cmd.downloadWorkshopItem(mod);
    }
}
