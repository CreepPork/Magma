import Command from '@oclif/command';
import ora from 'ora';

import SteamCmd from '../steamcmd';

import * as inquirer from 'inquirer';

export default class Login extends Command {
    public async run(): Promise<void> {
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
        cmd.login().then(() => {
            loginSpinner.stop();
            this.log(`User '${credentials.username}' has been logged in.`);
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
