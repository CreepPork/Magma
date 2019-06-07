import { ISteamCredentials } from './commands/login';
import { IMod } from './mod';
import { ISupportedServer } from './servers';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';

export default class Settings {
    public static has<T extends keyof ISettings>(key: T): boolean {
        const contents: ISettings = JSON.parse(fs.readFileSync(this.getFile()).toString());

        // Key can be a false boolean and it will fail even though it exists
        if (contents[key] !== undefined) {
            return true;
        }

        return false;
    }

    public static get<T extends keyof ISettings, K extends ISettings[T]>(key: T): K | never {
        const contents: ISettings = JSON.parse(fs.readFileSync(this.getFile()).toString());

        if (contents[key] !== undefined) {
            return contents[key] as K;
        }

        throw new Error(`Key ${key} not found.`);
    }

    public static getAll(): ISettings {
        return JSON.parse(fs.readFileSync(this.getFile()).toString());
    }

    public static write<T extends keyof ISettings, K extends ISettings[T]>(key: T, value: K) {
        const contents: ISettings = JSON.parse(fs.readFileSync(this.getFile()).toString());

        contents[key] = value;

        fs.writeFileSync(this.getFile(), JSON.stringify(contents, undefined, 4));
    }

    public static writeAll(values: ISettings) {
        fs.writeFileSync(this.getFile(), JSON.stringify(values, undefined, 4));
    }

    public static fileExists(): boolean {
        return fs.existsSync(this.getFile());
    }

    public static createFile() {
        if (! fs.existsSync(this.getFile())) {
            fs.writeFileSync(this.getFile(), '');
        }
    }

    private static getFile(): string {
        return path.join(process.cwd(), 'magma.json');
    }
}

export interface ISettings {
    server: ISupportedServer;
    mods: IMod[];
    steamCmdPath: string;
    gameServerPath: string;
    instanceConfigPath?: string;
    linuxGsmEnabled?: boolean;
    steamCredentials: ISteamCredentials;
    encryptionKey: string;
    ivKey: string;
}
