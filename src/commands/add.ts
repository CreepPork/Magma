import { flags } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import Command from '../command';
import Mod from '../mod';
import Settings from '../settings';

export default class Add extends Command {
    public static description = 'Adds Steam Workshop item data to the config file.';
    public static examples = [
        'magma add 723217262',
        'magma add 450814997 723217262 713709341',
        'magma add 430091721 -g 4000',
    ];

    public static strict = false;
    public static args = [
        {
            description: 'Steam Workshop item IDs. Chaining them will add all of them at once.',
            name: 'itemId',
            required: true,
        },
    ] as IArg[];

    public static flags = {
        gameAppId: flags.integer({
            char: 'g',
            description: 'Steam game app ID. Can be found at SteamDB or in the URL.',
        }),
    };

    public async run() {
        this.checkIfInitialized();
        // tslint:disable-next-line: no-shadowed-variable
        const { argv, flags } = this.parse(Add);

        const appId = flags.gameAppId ? flags.gameAppId : Settings.get('server').gameAppId;
        const itemIds = argv.map(arg => parseInt(arg, 10));

        const mods = [];
        for (const itemId of itemIds) {
            mods.push(await Mod.generateModFromId(appId, itemId, true));
        }
    }
}
