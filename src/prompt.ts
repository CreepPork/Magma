import { prompt } from 'inquirer';
import ConfigEntries from './constants/configEntries';
import Filesystem from './filesystem';
import IConfigEntry from './interfaces/iConfigEntry';
import ISteamCredentials from './interfaces/iSteamCredentials';
import Validate from './validator';

import ora = require('ora');


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

    public async forBatchScript(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the Batch script starting your server, where it has your mods',
            name: 'path',
            type: 'input',
            validate: path => { return Filesystem.hasExtension(path, '.bat') }
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

    public async forConfigEntries(): Promise<IConfigEntry[]> {
        const cmdPathName = ConfigEntries.find(e => e.config === 'steamCmdPath')?.displayName;

        // Get only those constants where their condition is true or doesn't have one
        // Return only the display names (for user output)

        // Sort the array by setting the 'SteamCMD path' property to the top
        // This is because we want that property to be ran first later in the execution chain
        // Thus, preventing issues when later the user might have specified to change the steamcmd path and credentials.
        // We could imagine a situation that the SteamCMD executable was moved and would result in the credential
        // Verification to fail because the verification method could not open the executable.
        const choices = ConfigEntries
            .filter(entry => entry.condition === undefined || entry.condition() === true)
            .map(entry => entry.displayName)
            .sort((a, b) => a === cmdPathName ? -1 : b === cmdPathName ? 1 : 0);

        const response: { entries: string[] } = await prompt({
            choices,
            message: 'What config entries would you like to edit?',
            name: 'entries',
            type: 'checkbox',
            validate: list => list.length > 0,
        });

        // Get config keys from selected choices
        const entries = [];

        for (const entry of response.entries) {
            const configEntryIndex = ConfigEntries.findIndex(e => e.displayName === entry);

            entries.push(ConfigEntries[configEntryIndex]);
        }

        return entries;
    }
}
