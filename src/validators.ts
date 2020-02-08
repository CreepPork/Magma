import ora = require('ora');

import Filesystem from './filesystem';
import Encrypter from './encrypter';
import Server from './constants/server';
import ISteamCredentials from './interfaces/iSteamCredentials';
import SteamCmd from './steam/steamCmd';
import Prompts from './prompts';

export default class Validators {
    private nonInteractive: boolean;
    private spinner?: ora.Ora;

    constructor(nonInteractive: boolean, spinner?: ora.Ora) {
        this.nonInteractive = nonInteractive;
        this.spinner = spinner;
    }

    public validateSteamCmd(path: string): boolean {
        if (Filesystem.isFile(path) && Filesystem.getFilenameNoExt(path) === 'steamcmd') {
            return true;
        }

        return false;
    }

    public validateServer(path: string): boolean {
        if (Filesystem.isDirectory(path) && Filesystem.directoryContains(path, Server.executable)) {
            return true;
        }

        return false;
    }

    public async validateCredentials(credentials: ISteamCredentials, key: string, steamCmdPath: string, guardCode?: string): Promise<boolean> {
        const password = new Encrypter(key).encrypt(credentials.password);

        const prompt = new Prompts(this.nonInteractive, this.spinner);

        // As the function will be executed in the SteamCmd scope, InitializeCommand this variables will not persist
        const promptForSteamGuard = prompt.promptForSteamGuard.bind(this);

        const successfulLogin = await SteamCmd.login(
            { username: credentials.username, password }, key, undefined, steamCmdPath, promptForSteamGuard, guardCode
        );

        if (!successfulLogin) {
            if (this.nonInteractive) {
                throw new Error('Failed to login. Did you provide the username and the password (guard code) correcly?');
            }
        }

        return successfulLogin;
    }
}
