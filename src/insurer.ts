import { prompt } from 'inquirer';
import Config from './config';
import Filesystem from './filesystem';
import IMod from './interfaces/iMod';
import ISteamCredentials from './interfaces/iSteamCredentials';
import Prompt from './prompt';
import Validate from './validator';

import ora = require('ora');

export default class Insurer {
    public validate: Validate;
    public prompt: Prompt;

    private nonInteractive: boolean;

    constructor(nonInteractive: boolean, spinner?: ora.Ora) {
        this.nonInteractive = nonInteractive;

        this.validate = new Validate(nonInteractive, spinner);
        this.prompt = new Prompt(nonInteractive, spinner);
    }

    public async ensureValidIds(mods: IMod[], message: string): Promise<number[]> {
        const ids = [];

        if (this.nonInteractive) {
            throw new Error(
                'Item IDs have to be specified as arguments when running in non-interactive mode.',
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
            const valid = this.validate.steamCmd(steamCmd);

            if (!valid) {
                if (this.nonInteractive) {
                    throw new Error('The given SteamCMD path is invalid. Did you include the executable as well?');
                }

                steamCmd = await this.prompt.forSteamCmd();
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The SteamCMD path was not given.');
            }

            steamCmd = await this.prompt.forSteamCmd();
        }

        return steamCmd;
    }

    public async ensureValidServer(server?: string): Promise<never | string> {
        if (server) {
            const valid = this.validate.server(server);

            if (!valid) {
                if (this.nonInteractive) {
                    throw new Error(
                        'The given Arma 3 server directory is invalid. ' +
                        'Did you enter the directory where the arma3server executable resides?',
                    );
                }

                server = await this.prompt.forServer();
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The Arma 3 server directory was not given.');
            }

            server = await this.prompt.forServer();
        }

        return server;
    }

    public async ensureValidLogin(username?: string, password?: string): Promise<never | ISteamCredentials> {
        let credentials;

        if (username && password) {
            if (username === '' || password === '') {
                if (this.nonInteractive) {
                    throw new Error('The given credentials were invalid. Did you enter empty credentials?');
                }

                credentials = await this.prompt.forCredentials();
            } else {
                credentials = { username, password };
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The Steam users credentials were not given.');
            }

            credentials = await this.prompt.forCredentials();
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

                return await this.prompt.forLinuxGsm();
            }
        } else {
            if (!this.nonInteractive) {
                const response: { uses: boolean } = await prompt({
                    message: 'Are you using LinuxGSM?',
                    name: 'uses',
                    type: 'confirm',
                });

                if (response.uses) {
                    return await this.prompt.forLinuxGsm();
                }
            }
        }
    }

    public async ensureValidBatchScript(path?: string): Promise<string | undefined | never> {
        if (process.platform === 'linux') { return; }

        if (path) {
            if (Filesystem.isFile(path)) {
                return path;
            } else {
                if (this.nonInteractive) {
                    throw new Error('The Batch script file path is invalid. Did you include the file?');
                }

                return await this.prompt.forBatchScript();
            }
        } else {
            if (!this.nonInteractive) {
                const response: { uses: boolean } = await prompt({
                    message: 'Are you using a Batch script to start your server?',
                    name: 'uses',
                    type: 'confirm',
                });

                if (response.uses) {
                    return await this.prompt.forBatchScript();
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
                    return await this.prompt.forWebhookUrl();
                }
            }
        }
    }
}
