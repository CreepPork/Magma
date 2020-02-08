import { prompt } from 'inquirer';

import ora = require('ora');

import Filesystem from './filesystem';
import Validators from './validators';
import ISteamCredentials from './interfaces/iSteamCredentials';

export default class Prompts {
    private nonInteractive: boolean;
    private spinner?: ora.Ora;

    private validator: Validators;

    constructor(nonInteractive: boolean, spinner?: ora.Ora) {
        this.nonInteractive = nonInteractive;
        this.spinner = spinner;
        this.validator = new Validators(nonInteractive);
    }

    public async promptForSteamCmd(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the SteamCMD executable (including the file itself)',
            name: 'path',
            type: 'input',
            validate: this.validator.validateSteamCmd,
        });

        return response.path;
    }

    public async promptForServer(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the directory where the server is (where the server executable is)',
            name: 'path',
            type: 'input',
            validate: this.validator.validateServer,
        });

        return response.path;
    }

    public async promptForCredentials(): Promise<ISteamCredentials> {
        const response: ISteamCredentials = await prompt([{
            message: 'Steam username',
            name: 'username',
            type: 'input',
            validate: user => user !== '',
        }, {
            message: 'Steam user password',
            name: 'password',
            type: 'password',
            validate: pass => pass !== '',
        }]);

        return response;
    }

    public async promptForSteamGuard(): Promise<string> {
        if (this.nonInteractive) {
            throw new Error('Steam Guard code has not been provided. Did you enter the code in the flag?');
        }

        this.spinner?.stop();

        const response: { guardCode: string } = await prompt({
            message: 'Steam Guard code',
            name: 'guardCode',
            type: 'input',
            validate: input => input !== '',
        });

        this.spinner?.start();

        return response.guardCode;
    }

    public async promptForLinuxGsm(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the LinuxGSM instance configuration file (where it handles mods/servermods)',
            name: 'path',
            type: 'input',
            validate: Filesystem.isFile,
        });

        return response.path;
    }

    public async promptForWebhookUrl(): Promise<string> {
        const response: { url: string } = await prompt({
            message: 'A webhook URL for the cron command to use?',
            name: 'url',
            type: 'input',
            validate: input => input !== '',
        });

        return response.url;
    }
}
