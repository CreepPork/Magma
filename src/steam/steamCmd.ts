import * as pty from 'node-pty';
import * as os from 'os';

import Config from '../config';
import CServer from '../constants/server';
import Encrypter from '../encrypter';

export default class SteamCmd {
    public static process?: pty.IPty;

    public static login(credentials = Config.get('credentials'), key = Config.get('key'), exit?: boolean, path?: string, onGuardPrompt?: () => Promise<string>, guardCode?: string):
        Promise<boolean> {
        return new Promise(resolve => {
            const password = new Encrypter(key).decrypt(credentials.password);

            let loginSuccessful = false;

            this.runCommand(`+login ${credentials.username} ${password}`, async data => {
                if (data.includes('Steam Guard code:')) {
                    if (guardCode) {
                        if (this.process) {
                            this.process.write(`${guardCode}\r`);
                        }
                    } else if (onGuardPrompt) {
                        const code = await onGuardPrompt();

                        if (this.process) {
                            this.process.write(`${code}\r`);
                        }
                    } else {
                        resolve(false);
                    }
                } else if (data === 'Logged in OK\r\nWaiting for user info...') {
                    loginSuccessful = true;
                } else if (loginSuccessful && data === 'OK\r\n') {
                    resolve(true);
                } else if (data.startsWith('FAILED login with result code')) {
                    resolve(false);
                } else if (data === 'exit\r\n') {
                    resolve(false);
                }
            }, exit, path);
        });
    }

    public static download(...ids: number[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const serverPath = Config.get('serverPath');

            console.log('Logging in...');

            const loggedIn = await this.login(undefined, undefined, false);
            if (!loggedIn) { reject(new Error('Failed to log in into Steam')); }

            console.log('Logged in');

            if (this.process) {
                this.process.on('exit', () => {
                    resolve();
                });

                this.process.write(
                    process.platform === 'win32'
                        ? `force_install_dir "${serverPath}"\r`
                        : `force_install_dir ${serverPath}\r`,
                );

                // Output download process information somewhat (steamcmd is terrible at output)
                this.process.on('data', data => {
                    if (data.startsWith('Downloading item')) {
                        console.log(data.trim());
                    } else if (data.startsWith('Success.')) {
                        console.log(
                            data.substr(0, data.lastIndexOf(' '))
                        );
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

    private static runCommand(command: string, onData: (data: string) => void, exit = true, path?: string): void {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        const steamCmd = path ?? Config.get('steamCmdPath');

        const process = pty.spawn(shell, [],
            // @ts-ignore Per the docs it exists, but it's not in the typings.
            { handleFlowControl: true },
        );

        this.process = process;

        process.on('data', onData);

        process.write(`${steamCmd} ${command} ${exit ? '+exit && exit 0' : ''}\r`);
    }

    private static exitTerminal(): void {
        if (this.process) {
            this.process.write('exit\r');
            this.process.write('exit 0\r');
        }
    }
}
