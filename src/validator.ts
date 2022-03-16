import ora = require('ora');

import Server from './constants/server';
import Encrypter from './encrypter';
import Filesystem from './filesystem';
import ISteamCredentials from './interfaces/iSteamCredentials';
import Prompt from './prompt';
import SteamCmd from './steam/steamCmd';

export default class Validator {
    private nonInteractive: boolean;
    private spinner?: ora.Ora;

    constructor(nonInteractive: boolean, spinner?: ora.Ora) {
        this.nonInteractive = nonInteractive;
        this.spinner = spinner;
    }

    public steamCmd(path: string): boolean {
        if (Filesystem.isFile(path) && Filesystem.getFilenameNoExt(path) === 'steamcmd') {
            return true;
        }

        return false;
    }

    public server(path: string): boolean {
        if (Filesystem.isDirectory(path) && Filesystem.directoryContains(path, Server.executable)) {
            return true;
        }

        return false;
    }

    public async credentials(credentials: ISteamCredentials, key: string, steamCmdPath: string, guardCode?: string, verbose = false): Promise<boolean> {
        const password = new Encrypter(key).encrypt(credentials.password);

        const prompt = new Prompt(this.nonInteractive, this.spinner);

        // As the function will be executed in the SteamCmd scope, InitializeCommand this variables will not persist
        const promptForSteamGuard = prompt.forSteamGuard.bind(this);

        const successfulLogin = await SteamCmd.login(
            { username: credentials.username, password },
            key,
            undefined,
            steamCmdPath,
            promptForSteamGuard,
            guardCode,
            verbose
        );

        if (!successfulLogin) {
            if (this.nonInteractive) {
                throw new Error('Failed to login. Did you provide the username and the password (guard code) correcly?');
            }
        }

        return successfulLogin;
    }
}
