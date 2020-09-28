import * as progress from 'cli-progress';
import * as pty from 'node-pty';
import Config from '../../config';
import CServer from '../../constants/server';
import Encrypter from '../../encrypter';
import ISteamCmdPlatform from '../../interfaces/iSteamCmdPlatform';
import SteamApi from '../steamApi';
import SteamCmd from '../steamCmd';

export default class SteamCmdLinux implements ISteamCmdPlatform {
    public process?: pty.IPty;

    constructor() {
        //
    }

    public login(credentials = Config.get('credentials'), key = Config.get('key'), exit?: boolean, path?: string, onGuardPrompt?: () => Promise<string>, guardCode?: string):
        Promise<boolean> {
        return new Promise(resolve => {
            const password = new Encrypter(key).decrypt(credentials.password);

            let loginSuccessful = false;

            this.runCommand(`+login ${credentials.username} ${password}`, async data => {
                if (data.includes('Steam Guard code:')) {
                    if (guardCode) {
                        this.process?.write(`${guardCode}\r`);
                    } else if (onGuardPrompt) {
                        const code = await onGuardPrompt();
                        this.process?.write(`${code}\r`);
                    } else {
                        resolve(false);
                    }
                } else if (data.includes('Waiting for user info...')) {
                    loginSuccessful = true;
                } else if (loginSuccessful && data.includes('OK')) {
                    resolve(true);
                } else if (data.includes('FAILED login with result code')) {
                    resolve(false);
                } else if (data.includes('exit\r\n')) {
                    resolve(false);
                }
            }, exit, path);
        });
    }

    public download(ids: number[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (ids.length === 0) { return resolve(); }

            const serverPath = Config.get('serverPath');

            console.log('Logging in...');

            const loggedIn = await this.login(undefined, undefined, false);
            if (!loggedIn) { return reject(new Error('Failed to log in into Steam. Perhaps, Steam Guard is requesting a new code? Try running `magma login`.')); }

            console.log('Logged in');

            console.log('Fetching API data');

            const apiMods = await SteamApi.getPublishedItems(ids);

            if (this.process) {
                const bar = new progress.SingleBar({
                    format: '[{bar}] {percentage}% | Downloading {title} ({size}) | {value}/{total}'
                });

                let index = 0;
                bar.start(ids.length, index, SteamCmd.generateProgressPayload(index, apiMods, ids));

                this.process.on('exit', () => {
                    bar.increment();
                    bar.stop();
                    resolve();
                });

                this.process.write(
                    `force_install_dir ${serverPath}\r`,
                );

                // Output download process information somewhat (steamcmd is terrible at output)
                this.process.on('data', data => {
                    if (data.startsWith('Success.')) {
                        index++;
                        // Prevent an out-of-range exception
                        if (index !== ids.length) {
                            bar.increment(1, SteamCmd.generateProgressPayload(index, apiMods, ids));
                        }
                    } else if (data.includes('ERROR!')) {
                        reject(new Error(data));
                    }
                });

                for (const id of ids) {
                    this.process.write(`workshop_download_item ${CServer.id} ${id}\r`);
                }

                this.exitTerminal();
            } else {
                reject(new Error('Failed to write to the SteamCMD console. Seems like the process did not start.'));
            }
        });
    }

    private runCommand(command: string, onData: (data: string) => void, exit = true, path?: string): void {
        const steamCmd = path ?? Config.get('steamCmdPath');

        const process = pty.spawn('bash', [], {
            handleFlowControl: true,
        });

        this.process = process;

        process.on('data', onData);

        process.write(`${steamCmd} ${command} ${exit ? '+exit && exit 0' : ''}\r`);
    }

    private exitTerminal(): void {
        if (this.process) {
            this.process.write('exit\r');
            this.process.write('exit 0\r');
        }
    }
}
