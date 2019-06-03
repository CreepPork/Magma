import ora from 'ora';

import Command from '../command';
import Crypto from '../cypto';
import Settings from '../settings';
import SteamCmd, { SteamCmdEvents } from '../steamcmd';

import * as inquirer from 'inquirer';

export default class Login extends Command {
    public static description = 'Logs into SteamCMD.';

    public async run(): Promise<void> {
        this.checkIfInitialized();

        const credentials: Record<keyof ISteamCredentials, string> = await inquirer.prompt([{
            message: 'Steam username',
            name: 'username',
            type: 'input',
        },
        {
            mask: '*',
            message: 'Steam password',
            name: 'password',
            type: 'password',
        }]);

        credentials.username = credentials.username !== '' ? credentials.username : 'anonymous';
        credentials.password = credentials.password !== '' ? credentials.password : '';

        const cmd = new SteamCmd(credentials.username, credentials.password);

        const loginSpinner = ora(`Logging in as user '${credentials.username}'`).start();

        cmd.on('steamGuardRequired' as SteamCmdEvents, async () => {
            loginSpinner.stop();

            const auth: { code: string } = await inquirer.prompt({
                message: 'Steam Guard code',
                name: 'code',
                type: 'input',
                validate: code => code !== '',
            });

            cmd.emit('steamGuardSent' as SteamCmdEvents, auth.code);

            loginSpinner.start();
        });

        return cmd.login().then(() => {
            loginSpinner.stop();
            this.log(`User '${credentials.username}' has been logged in.`);

            Settings.write('steamCredentials', {
                password: new Crypto().encrypt(credentials.password),
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
