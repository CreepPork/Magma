import Command from '../command';
import Config from '../config';
import Encrypter from '../encrypter';
import * as setFlag from '../flags';
import Insurer from '../insurer';
import SteamCmd from '../steam/steamCmd';

import ora = require('ora');

export default class LoginCommand extends Command {
    public static description = 'Helps to fix any Steam issues when it fails to log you in.';
    public static examples = [
        'magma login',
        'magma login username password'
    ];
    public static flags = {
        nonInteractive: setFlag.nonInteractive,
        password: setFlag.password,
        steamGuard: setFlag.steamGuard,
        username: setFlag.username,
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
        Config.ensureIsLatestVersion();
    }

    public async run(): Promise<void> {
        const { flags } = this.parse(LoginCommand);
        const nonInteractive = flags.nonInteractive;

        const spinner = ora({ discardStdin: true, text: 'Validating Steam credentials' });

        // Try to login to verify if the credentials are working
        try {
            spinner.start();

            const loggedIn = await SteamCmd.login();

            if (loggedIn) {
                spinner.succeed(`Steam login is working properly and there's nothing more to do.`);

                return;
            } else {
                throw new Error();
            }
        } catch (error) {
            spinner.fail(`Failed to login into Steam. We'll try to log you back in.`);
        }

        // Prompt for credentials
        const insurer = new Insurer(nonInteractive, spinner);

        let credentials = await insurer.ensureValidLogin(flags.username, flags.password);

        const key = Encrypter.generateKey();
        spinner.start();

        while (await insurer.validate.credentials(credentials, key, Config.get('steamCmdPath'), flags.steamGuard) === false) {
            spinner.fail('Failed to login');

            credentials = await insurer.prompt.forCredentials();

            spinner.start();
        }

        spinner.succeed('Logged in');

        Config.set('key', key);
        Config.set('credentials', {
            password: new Encrypter(key).encrypt(credentials.password),
            username: credentials.username
        });
    }
}
