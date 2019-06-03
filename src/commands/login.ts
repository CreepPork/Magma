import ora from 'ora';

import Command from '../command';
import Settings from '../settings';
import SteamCmd, { LoginEvents } from '../steamcmd';

import * as inquirer from 'inquirer';

export default class Login extends Command {
    public static description = 'Logs into SteamCMD.';

    public async run(): Promise<void> {
        this.checkIfInitialized();

        const credentials: Record<keyof ISteamCredentials, string> = await inquirer.prompt([{
            message: 'Steam username',
            name: 'username',
            type: 'input',
            validate: name => name !== '',
        },
        {
            mask: '*',
            message: 'Steam password',
            name: 'password',
            type: 'password',
            validate: pass => pass !== '',
        }]);

        const cmd = new SteamCmd(credentials.username, credentials.password);

        const loginSpinner = ora(`Logging in user '${credentials.username}'`).start();

        cmd.on('steamGuardRequired' as LoginEvents, async () => {
            loginSpinner.stop();

            const auth: { code: string } = await inquirer.prompt({
                message: 'Steam Guard code',
                name: 'code',
                type: 'input',
                validate: code => code !== '',
            });

            cmd.emit('steamGuardSent' as LoginEvents, auth.code);

            loginSpinner.start();
        });

        return cmd.login().then(() => {
            loginSpinner.stop();
            this.log(`User '${credentials.username}' has been logged in.`);

            Settings.write('steamCredentials', {
                password: credentials.password,
                username: credentials.username,
            });
        }).catch((error: Error) => {
            loginSpinner.stop();
            this.error(error.message, {
                exit: false,
            });
        });
    }
}

export interface ISteamCredentials {
    username: string;
    password: string;
}
