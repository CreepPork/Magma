import IMod from './iMod';
import ISteamCredentials from './iSteamCredentials';

export default interface IConfig {
    version: number;
    lastId: number;
    mods: IMod[];
    serverPath: string;
    steamCmdPath: string;
    linuxGsm?: string;
    key: string;
    credentials: ISteamCredentials;
    webhookUrl?: string;
    cronMessages: number[];
}
