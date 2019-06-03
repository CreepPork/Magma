import Settings from './settings';

import * as execa from 'execa';
import * as kill from 'tree-kill';

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

export default class SteamCmd extends EventEmitter {
    private username: string;
    private password: string;
    private authCode?: string;

    private cmdPath: string;

    constructor(user: string, password: string, authCode?: string) {
        super();

        this.username = user;
        this.password = password;
        this.authCode = authCode;

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
                        stdin.write(`login ${this.username} ${this.password} ${this.authCode ? this.authCode : ''}\n`);
                        hasTriedToLogin = true;

                        this.emit('loginTriggered');
                    }

                    if (hasTriedToLogin) {
                        if (text.includes('FAILED login with result code')) {
                            this.emit('error');

                            stdin.write('quit\n');
                            kill(cmd.pid);

                            reject(new Error(text.split('\n')[0]));
                        }

                        if (text.includes('OK')) {
                            okTimes++;

                            if (okTimes >= 2) {
                                this.emit('loggedIn');

                                stdin.write('quit\n');
                                kill(cmd.pid);

                                resolve();
                            }
                        }
                    }
                }

                if (text.includes('Steam Guard code:')) {
                    this.on('steamGuardSent', (code: string) => {
                        stdin.write(`${code}\n`);
                    });
                    this.emit('steamGuardRequired');
                }
            });
        });
    }
}

export type LoginEvents = 'loginTriggered' | 'loggedIn' | 'steamGuardRequired' | 'error';
