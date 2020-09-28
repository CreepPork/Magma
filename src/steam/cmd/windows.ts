import * as pty from 'node-pty';
import Config from '../../config';
import ISteamCmdPlatform from '../../interfaces/iSteamCmdPlatform';

export default class SteamCmdWindows implements ISteamCmdPlatform {
    public process?: pty.IPty;

    constructor() {
        throw new Error('Sorry, the Windows support for SteamCMD is currently in development. Check back in a different version to see the full support for Windows.');
    }

    public login(credentials = Config.get('credentials'), key = Config.get('key'), exit?: boolean, path?: string, onGuardPrompt?: () => Promise<string>, guardCode?: string):
        Promise<boolean> {
        return new Promise(resolve => {
            //
        });
    }

    public download(ids: number[]): Promise<void> {
        return new Promise(resolve => {
            //
        });
    }
}
