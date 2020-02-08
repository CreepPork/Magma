import { prompt } from 'inquirer';

import ora = require('ora');

import Filesystem from './filesystem';
import Validate from './validator';
import ISteamCredentials from './interfaces/iSteamCredentials';

export default class Prompt {
    private nonInteractive: boolean;
    private spinner?: ora.Ora;

    private validator: Validate;

    constructor(nonInteractive: boolean, spinner?: ora.Ora) {
        this.nonInteractive = nonInteractive;
        this.spinner = spinner;
        this.validator = new Validate(nonInteractive);
    }

    public async forSteamCmd(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the SteamCMD executable (including the file itself)',
            name: 'path',
            type: 'input',
            validate: this.validator.steamCmd,
        });

        return response.path;
    }

    public async forServer(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the directory where the server is (where the server executable is)',
            name: 'path',
            type: 'input',
            validate: this.validator.server,
        });

        return response.path;
    }

    public async forCredentials(): Promise<ISteamCredentials> {
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

    public async forSteamGuard(): Promise<string> {
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

    public async forLinuxGsm(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the LinuxGSM instance configuration file (where it handles mods/servermods)',
            name: 'path',
            type: 'input',
            validate: Filesystem.isFile,
        });

        return response.path;
    }

    public async forWebhookUrl(): Promise<string> {
        const response: { url: string } = await prompt({
            message: 'A webhook URL for the cron command to use?',
            name: 'url',
            type: 'input',
            validate: input => input !== '',
        });

        return response.url;
    }
}
