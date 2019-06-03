import Command from '@oclif/command';
import ora from 'ora';

import SteamCmd, { LoginEvents } from '../steamcmd';

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

        const hasGuard: { answer: boolean } = await inquirer.prompt({
            default: false,
            message: `Does this account have Steam Guard / You haven't signed in before?`,
            name: 'answer',
            type: 'confirm',
        });

        if (hasGuard.answer) {
            const auth: { code: string } = await inquirer.prompt({
                message: 'Steam Guard code',
                name: 'code',
                type: 'input',
            });

            credentials.authCode = auth.code;
        }

        const cmd = new SteamCmd(credentials.username, credentials.password, credentials.authCode);

        const loginSpinner = ora(`Logging in user '${credentials.username}'`).start();

        cmd.on('steamGuardRequired' as LoginEvents, async () => {
            const auth: { code: string } = await inquirer.prompt({
                message: 'Steam Guard code',
                name: 'code',
                type: 'input',
                validate: code => code !== '',
            });

            cmd.emit('steamGuardSent', auth.code);
        });

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
    authCode?: string;
}
