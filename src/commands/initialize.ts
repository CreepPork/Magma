import Command, { flags as flag } from '@oclif/command';
import { prompt } from 'inquirer';

import Config from '../config';
import Filesystem from '../filesystem';

import Server from '../constants/server';
import Encrypter from '../encrypter';
import ISteamCredentials from '../interfaces/iSteamCredentials';
import SteamCmd from '../steam/steamCmd';

import ora = require('ora');

export default class InitializeCommand extends Command {
    public static description = 'Initializes the configuration data required for Magma to operate.';
    public static aliases = ['init'];
    public static flags = {
        force: flag.boolean({
            char: 'f',
            default: false,
            description: 'Skip the check for the magma.json file. If it exists, it will be overwritten.',
        }),
        linuxGsmInstanceConfig: flag.string({
            char: 'l',
            description: 'Absolute path to the LinuxGSM instance configuration file (where it handles mods/servermods)',
        }),
        nonInteractive: flag.boolean({
            char: 'n',
            default: false,
            description: 'Do not prompt for any input.',
        }),
        password: flag.string({
            char: 'p',
            description: 'Steam user password.',
        }),
        server: flag.string({
            char: 's',
            description: 'Absolute path to the directory where the server is (where the server executable is).',
        }),
        steamCmd: flag.string({
            char: 'c',
            description: 'Absolute path to the SteamCMD executable (including the file itself).',
        }),
        username: flag.string({
            char: 'u',
            description: 'Steam username.',
        }),
    };

    private nonInteractive: boolean = false;

    public async run(): Promise<void> {
        const { flags } = this.parse(InitializeCommand);
        this.nonInteractive = flags.nonInteractive;

        await this.ensureNoConfig(flags.force);

        const steamCmdPath = await this.ensureValidSteamCmd(flags.steamCmd);

        const serverPath = await this.ensureValidServer(flags.server);

        let credentials = await this.ensureValidLogin(flags.username, flags.password);

        const key = Encrypter.generateKey();

        const spinner = ora({ discardStdin: true, text: 'Validating Steam credentials' }).start();

        while (await this.validateCredentials(credentials, key) === false) {
            spinner.fail('Failed to login');
            credentials = await this.promptForCredentials();
            spinner.start();
        }

        spinner.succeed('Logged in');

        const linuxGsm = await this.ensureValidLinuxGsm(flags.linuxGsmInstanceConfig);

        Config.setAll({
            credentials: {
                password: new Encrypter(key).encrypt(credentials.password),
                username: credentials.username,
            },
            key,
            linuxGsm,
            mods: [],
            serverPath,
            steamCmdPath,
        });
    }

    private async ensureNoConfig(force: boolean): Promise<never | void> {
        if (! force) {
            if (Config.exists()) {
                if (this.nonInteractive) {
                    throw new Error('Magma is already initialized. Add the --force flag to overwrite the magma.json file.');
                }

                const response: { overwrite: boolean } = await prompt({
                    message: 'The magma.json file exists here. Do you want to overwrite it?',
                    name: 'overwrite',
                    type: 'confirm',
                });

                if (response.overwrite === false) { this.exit(1); }
            }
        }
    }

    private async ensureValidSteamCmd(steamCmd: string | undefined): Promise<never | string> {
        if (steamCmd) {
            const valid = this.validateSteamCmd(steamCmd);

            if (! valid) {
                if (this.nonInteractive) {
                    throw new Error('The given SteamCMD path is invalid. Did you include the executable as well?');
                }

                steamCmd = await this.promptForSteamCmd();
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The SteamCMD path was not given.');
            }

            steamCmd = await this.promptForSteamCmd();
        }

        return steamCmd;
    }

    private validateSteamCmd(path: string): boolean {
        if (Filesystem.isFile(path) && Filesystem.getFilenameNoExt(path) === 'steamcmd') {
            return true;
        }

        return false;
    }

    private async promptForSteamCmd(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the SteamCMD executable (including the file itself)',
            name: 'path',
            type: 'input',
            validate: this.validateSteamCmd,
        });

        return response.path;
    }

    private async ensureValidServer(server: string | undefined): Promise<never | string> {
        if (server) {
            const valid = this.validateServer(server);

            if (! valid) {
                if (this.nonInteractive) {
                    throw new Error(
                        'The given Arma 3 server directory is invalid.' +
                        'Did you enter the directory where the arma3server executable resides?',
                    );
                }

                server = await this.promptForServer();
            }
        } else {
            if (this.nonInteractive) {
                throw new Error('The Arma 3 server directory was not given.');
            }

            server = await this.promptForServer();
        }

        return server;
    }

    private validateServer(path: string): boolean {
        if (Filesystem.isDirectory(path) && Filesystem.directoryContains(path, Server.executable)) {
            return true;
        }

        return false;
    }

    private async promptForServer(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the directory where the server is (where the server executable is)',
            name: 'path',
            type: 'input',
            validate: this.validateServer,
        });

        return response.path;
    }

    private async ensureValidLogin(username: string | undefined, password: string | undefined):
        Promise<never | ISteamCredentials> {
            let credentials;

            if (username && password) {
                if (username === '' || password === '') {
                    if (this.nonInteractive) {
                        throw new Error('The given credentials were invalid. Did you enter empty credentials?');
                    }

                    credentials = await this.promptForCredentials();
                } else {
                    credentials = { username, password };
                }
            } else {
                if (this.nonInteractive) {
                    throw new Error('The Steam users credentials were not given.');
                }

                credentials = await this.promptForCredentials();
            }

            return credentials;
    }

    private async validateCredentials(credentials: ISteamCredentials, key: string): Promise<boolean> {
        const password = new Encrypter(key).encrypt(credentials.password);
        const successfulLogin = await SteamCmd.login({ username: credentials.username, password }, key);

        if (! successfulLogin) {
            if (this.nonInteractive) {
                throw new Error('Failed to login. Did you provide the username and the password correcly?');
            }
        }

        return successfulLogin;
    }

    private async promptForCredentials(): Promise<ISteamCredentials> {
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

    private async ensureValidLinuxGsm(path: string | undefined): Promise<string | undefined | never> {
        if (path) {
            if (Filesystem.isFile(path)) {
                return path;
            } else {
                if (this.nonInteractive) {
                    throw new Error('The LinuxGSM configuration file path is invalid. Did you include the file?');
                }

                return await this.promptForLinuxGsm();
            }
        } else {
            if (! this.nonInteractive) {
                const response: { uses: boolean } = await prompt({
                    message: 'Are you using LinuxGSM?',
                    name: 'uses',
                    type: 'confirm',
                });

                if (response.uses) {
                    return await this.promptForLinuxGsm();
                }
            }
        }
    }

    private async promptForLinuxGsm(): Promise<string> {
        const response: { path: string } = await prompt({
            message: 'Absolute path to the LinuxGSM instance configuration file (where it handles mods/servermods)',
            name: 'path',
            type: 'input',
            validate: Filesystem.isFile,
        });

        return response.path;
    }
}
