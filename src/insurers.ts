import { prompt } from 'inquirer';

import ora = require('ora');

import Config from './config';
import Filesystem from './filesystem';
import Prompts from './prompts';
import Validators from './validators';
import IMod from './interfaces/iMod';
import ISteamCredentials from './interfaces/iSteamCredentials';

export default class Insurers {
    public validator: Validators;
    public prompt: Prompts;

    private nonInteractive: boolean;

    constructor(nonInteractive: boolean, spinner?: ora.Ora) {
        this.nonInteractive = nonInteractive;

        this.validator = new Validators(nonInteractive, spinner);
        this.prompt = new Prompts(nonInteractive, spinner);
    }

    public static async ensureValidIds(mods: IMod[], noInteraction: boolean, message: string): Promise<number[]> {
        const ids = [];

        if (noInteraction) {
            throw new Error(
                'Steam Workshop item IDs have to be specified as arguments when running in non interactive mode.',
            );
        } else {
            const choices = mods.map(mod => mod.name);

            const response: { mods: string[] } = await prompt({
                choices,
                message,
                name: 'mods',
                type: 'checkbox',
                validate: list => list.length > 0,
            });

            for (const name of response.mods) {
                const index = mods.findIndex(mod => mod.name === name);

                ids.push(mods[index].id);
            }
        }

        return ids;
    }

    public async ensureNoConfig(force: boolean): Promise<never | void> {
        if (!force) {
            if (Config.exists()) {
                if (this.nonInteractive) {
                    throw new Error('Magma is already initialized. Add the --force flag to overwrite the magma.json file.');
                }

                const response: { overwrite: boolean } = await prompt({
                    message: 'The magma.json file exists here. Do you want to overwrite it?',
                    name: 'overwrite',
                    type: 'confirm',
                    default: false
                });

                if (response.overwrite === false) { process.exit(1); }
            }
        }
    }

    public async ensureValidSteamCmd(steamCmd?: string): Promise<never | string> {
        if (steamCmd) {
            const valid = this.validator.validateSteamCmd(steamCmd);

            if (!valid) {
                if (this.nonInteractive) {
                    throw new Error('The given SteamCMD path is invalid. Did you include the executable as well?');
                }

                steamCmd = await this.prompt.promptForSteamCmd();
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The SteamCMD path was not given.');
            }

            steamCmd = await this.prompt.promptForSteamCmd();
        }

        return steamCmd;
    }

    public async ensureValidServer(server?: string): Promise<never | string> {
        if (server) {
            const valid = this.validator.validateServer(server);

            if (!valid) {
                if (this.nonInteractive) {
                    throw new Error(
                        'The given Arma 3 server directory is invalid.' +
                        'Did you enter the directory where the arma3server executable resides?',
                    );
                }

                server = await this.prompt.promptForServer();
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The Arma 3 server directory was not given.');
            }

            server = await this.prompt.promptForServer();
        }

        return server;
    }

    public async ensureValidLogin(username?: string, password?: string):
        Promise<never | ISteamCredentials> {
        let credentials;

        if (username && password) {
            if (username === '' || password === '') {
                if (this.nonInteractive) {
                    throw new Error('The given credentials were invalid. Did you enter empty credentials?');
                }

                credentials = await this.prompt.promptForCredentials();
            } else {
                credentials = { username, password };
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The Steam users credentials were not given.');
            }

            credentials = await this.prompt.promptForCredentials();
        }

        return credentials;
    }

    public async ensureValidLinuxGsm(path?: string): Promise<string | undefined | never> {
        if (process.platform === 'win32') { return; }

        if (path) {
            if (Filesystem.isFile(path)) {
                return path;
            } else {
                if (this.nonInteractive) {
                    throw new Error('The LinuxGSM configuration file path is invalid. Did you include the file?');
                }

                return await this.prompt.promptForLinuxGsm();
            }
        } else {
            if (!this.nonInteractive) {
                const response: { uses: boolean } = await prompt({
                    message: 'Are you using LinuxGSM?',
                    name: 'uses',
                    type: 'confirm',
                });

                if (response.uses) {
                    return await this.prompt.promptForLinuxGsm();
                }
            }
        }
    }

    public async ensureValidWebhookUrl(url?: string): Promise<string | undefined | never> {
        if (url) {
            return url;
        } else {
            if (!this.nonInteractive) {
                const response: { uses: boolean } = await prompt({
                    message: 'Do you want to use a webhook for the cron command?',
                    name: 'uses',
                    type: 'confirm',
                    default: false,
                });

                if (response.uses) {
                    return await this.prompt.promptForWebhookUrl();
                }
            }
        }
    }
}
