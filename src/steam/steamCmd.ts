import * as pty from 'node-pty';
import * as os from 'os';

import Config from '../config';
import Encrypter from '../encrypter';

export default class SteamCmd {
    public static login(credentials = Config.get('credentials'), key = Config.get('key')): Promise<boolean> {
        return new Promise(resolve => {
            const password = new Encrypter(key).decrypt(credentials.password);

            let loginSuccessful = false;

            this.runCommand(`+login ${credentials.username} ${password}`, data => {
                if (data === 'Logged in OK\r\nWaiting for user info...') {
                    loginSuccessful = true;
                } else if (loginSuccessful && data === 'OK\r\n') {
                    resolve(true);
                } else if (data === 'exit\r\n') {
                    resolve(false);
                }
            });
        });
    }

    private static runCommand(command: string, onData: (data: string) => void): void {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        const steamCmd = Config.get('steamCmdPath');

        const process = pty.spawn(shell, [],
            // @ts-ignore Per the docs it exists, but it's not in the typings.
            { handleFlowControl: true },
        );

        process.on('data', onData);

        process.write(`${steamCmd} ${command} +exit && exit 0\r`);
    }
}
