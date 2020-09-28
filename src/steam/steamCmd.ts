import * as pty from 'node-pty';
import * as os from 'os';
import Config from '../config';
import Filesystem from '../filesystem';
import IProgressPayload from '../interfaces/iProgressPayload';
import ISteamPublishedFile from '../interfaces/iSteamPublishedFile';
import SteamCmdLinux from './cmd/linux';
import SteamCmdWindows from './cmd/windows';

export default class SteamCmd {
    public static process?: pty.IPty;

    public static async login(credentials = Config.get('credentials'), key = Config.get('key'), exit?: boolean, path?: string, onGuardPrompt?: () => Promise<string>, guardCode?: string):
        Promise<boolean> {
        if (os.platform() === 'win32') {
            return await (new SteamCmdWindows()).login(
                credentials,
                key,
                exit,
                path,
                onGuardPrompt,
                guardCode
            );
        } else {
            return await (new SteamCmdLinux()).login(
                credentials,
                key,
                exit,
                path,
                onGuardPrompt,
                guardCode
            );
        }
    }

    public static async download(ids: number[]): Promise<void> {
        if (os.platform() === 'win32') {
            await (new SteamCmdWindows()).download(
                ids
            );
        } else {
            await (new SteamCmdLinux()).download(
                ids
            );
        }
    }

    public static generateProgressPayload(index: number, apiMods: ISteamPublishedFile[], ids: number[]): IProgressPayload {
        const id = ids[index];
        const mod = apiMods.find(m => m.publishedfileid === `${id}`);

        if (!mod) {
            throw new Error('Could not fetch mod name and other data.');
        }

        return {
            id,
            title: mod.title,
            size: Filesystem.fileSizeForHumans(mod.file_size),
        }
    }
}
