import { flags as flag } from '@oclif/command';
import Command from '../command';
import Config from '../config';
import Encrypter from '../encrypter';
import * as setFlag from '../flags';
import Insurer from '../insurer';

import ora = require('ora');

export default class InitializeCommand extends Command {
    public static description = 'Initializes the configuration data required for Magma to operate.';
    public static aliases = ['init'];
    public static flags = {
        force: flag.boolean({
            char: 'f',
            default: false,
            description: 'Skip the check for the magma.json file. If it exists, it will be overwritten.',
        }),
        linuxGsmInstanceConfig: setFlag.linuxGsmInstanceConfig,
        batchScript: setFlag.batchScript,
        nonInteractive: setFlag.nonInteractive,
        password: setFlag.password,
        server: setFlag.server,
        steamCmd: setFlag.steamCmd,
        steamGuard: setFlag.steamGuard,
        username: setFlag.username,
        webhookUrl: setFlag.webhookUrl,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(InitializeCommand);
        const nonInteractive = flags.nonInteractive;

        const spinner = ora({ discardStdin: true, text: 'Validating Steam credentials' });

        const insurer = new Insurer(nonInteractive, spinner);

        await insurer.ensureNoConfig(flags.force);

        const steamCmdPath = await insurer.ensureValidSteamCmd(flags.steamCmd);

        const serverPath = await insurer.ensureValidServer(flags.server);

        let credentials = await insurer.ensureValidLogin(flags.username, flags.password);

        const key = Encrypter.generateKey();

        spinner.start();

        while (await insurer.validate.credentials(credentials, key, steamCmdPath, flags.steamGuard) === false) {
            spinner.fail('Failed to login');

            credentials = await insurer.prompt.forCredentials();

            spinner.start();
        }

        spinner.succeed('Logged in');

        const linuxGsm = await insurer.ensureValidLinuxGsm(flags.linuxGsmInstanceConfig);
        const batchScript = await insurer.ensureValidBatchScript(flags.batchScript);

        const webhookUrl = await insurer.ensureValidWebhookUrl(flags.webhookUrl);

        Config.setAll({
            version: Config.getLatestVersion(),
            lastId: 0,
            credentials: {
                password: new Encrypter(key).encrypt(credentials.password),
                username: credentials.username,
            },
            key,
            linuxGsm,
            batchScript,
            mods: [],
            serverPath,
            steamCmdPath,
            webhookUrl,
            cronMessages: [],
        });
    }
}
