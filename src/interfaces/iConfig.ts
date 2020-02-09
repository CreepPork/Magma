import IMod from './iMod';
import ISteamCredentials from './iSteamCredentials';

export default interface IConfig {
    mods: IMod[];
    serverPath: string;
    steamCmdPath: string;
    linuxGsm?: string;
    key: string;
    credentials: ISteamCredentials;
    webhookUrl?: string;
    cronMessages: number[];
}
