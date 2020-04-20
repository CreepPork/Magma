import * as fs from 'fs-extra';
import * as path from 'path';

import NotInitializedError from './errors/notInitializedError';
import IConfig from './interfaces/iConfig';
import OutdatedConfigurationFileError from './errors/outdatedConfigurationFileError';

export default class Config {
    public static exists(): boolean {
        return fs.existsSync(this.path());
    }

    public static get<T extends keyof IConfig, K extends IConfig[T]>(key: T): K {
        this.ensureIsInitialized();

        return this.getAll()[key] as K;
    }

    public static getAll(): IConfig | never {
        this.ensureIsInitialized();

        const data = fs.readFileSync(this.path()).toString();

        return JSON.parse(data);
    }

    public static set<T extends keyof IConfig>(key: T, value: IConfig[T]): void {
        this.ensureIsInitialized();

        const data = this.getAll();

        data[key] = value;

        this.setAll(data);
    }

    public static setAll(config: IConfig): void {
        fs.writeFileSync(this.path(), JSON.stringify(config, undefined, 4));
    }

    public static ensureIsInitialized(): never | void {
        if (!this.exists()) {
            throw new NotInitializedError();
        }
    }

    public static getLatestVersion(): number {
        return require('../package.json').magma.latestConfigVersion;
    }

    public static getCurrentVersion(): number | undefined {
        this.ensureIsInitialized();
        const config = this.getAll();

        if (config.version !== undefined) {
            return config.version;
        }
    }

    public static ensureIsLatestVersion(): never | void {
        const version = this.getCurrentVersion();

        if (version === undefined || version !== this.getLatestVersion()) {
            throw new OutdatedConfigurationFileError();
        }
    }

    private static path(): string {
        return path.join(process.cwd(), 'magma.json');
    }
}
