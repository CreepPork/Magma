import * as pty from 'node-pty';
import ISteamCredentials from './iSteamCredentials';

export default interface ISteamCmdPlatform {
    process?: pty.IPty;

    login(credentials: ISteamCredentials, key: string, exit?: boolean, path?: string, onGuardPrompt?: () => Promise<string>, guardCode?: string): Promise<boolean>;
    download(ids: number[]): Promise<void>;
}
