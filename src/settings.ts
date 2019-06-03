import { ISteamCredentials } from './commands/login';
import { IMod } from './popularMods';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';

export default class Settings {
    public static has<T extends keyof ISettings>(key: T): boolean {
        try {
            this.get(key);

            return true;
        } catch (error) {
            return false;
        }
    }

    public static get<T extends keyof ISettings, K extends ISettings[T]>(key: T): K {
        const contents: ISettings = JSON.parse(fs.readFileSync(this.getFile()).toString());

        if (contents[key]) {
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
    mods: IMod[];
    steamCmdPath: string;
    armaServerPath: string;
    steamCredentials: ISteamCredentials;
}
