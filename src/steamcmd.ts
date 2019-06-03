import Settings from './settings';

import * as execa from 'execa';
import * as kill from 'tree-kill';

import { Readable, Writable } from 'stream';

export default class SteamCmd {
    private username: string;
    private password: string;

    private cmdPath: string;

    constructor(user: string, password: string) {
        this.username = user;
        this.password = password;

        this.cmdPath = Settings.get('steamCmdPath');
    }

    public login(): Promise<void> {
        return new Promise((resolve, reject) => {
            let hasTriedToLogin = false;
            let okTimes = 0;

            const cmd = execa(this.cmdPath);
            cmd.catch(error => reject(error));

            const stdout = cmd.stdout as Readable;
            const stdin = cmd.stdin as Writable;

            stdout.on('data', (data: Buffer) => {
                const text = data.toString();

                if (text.includes('Steam>')) {
                    if (! hasTriedToLogin) {
                        stdin.write(`login ${this.username} ${this.password}\n`);
                        hasTriedToLogin = true;
                    }

                    if (hasTriedToLogin) {
                        if (text.includes('FAILED login with result code')) {
                            stdin.write('quit\n');
                            kill(cmd.pid);

                            reject(new Error(text.split('\n')[0]));
                        }

                        if (text.includes('OK')) {
                            okTimes++;

                            if (okTimes >= 2) {
                                stdin.write('quit\n');
                                kill(cmd.pid);

                                resolve();
                            }
                        }
                    }
                }
            });
        });
    }
}
