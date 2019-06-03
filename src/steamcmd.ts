import Settings from './settings';

import * as execa from 'execa';
import * as kill from 'tree-kill';

import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

export default class SteamCmd extends EventEmitter {
    private username: string;
    private password: string;

    private cmdPath: string;

    constructor(user: string, password: string) {
        super();

        this.username = user;
        this.password = password;

        this.cmdPath = Settings.get('steamCmdPath');
    }

    public login(): Promise<void> {
        return new Promise((resolve, reject) => {
            let hasTriedToLogin = false;
            let okTimes = 0;

            const cmd = execa(this.cmdPath, [`+login ${this.username} ${this.password}`, '+quit']);
            cmd.catch(error => reject(error));

            const stdout = cmd.stdout as Readable;
            const stdin = cmd.stdin as Writable;

            stdout.on('data', (data: Buffer) => {
                const text = data.toString();

                if (hasTriedToLogin) {
                    if (text.includes('FAILED login with result code')) {
                        reject(new Error(text.split('\n')[0]));
                    }

                    if (text.includes('OK')) {
                        okTimes++;

                        if (okTimes >= 2) {
                            resolve();
                        }
                    }
                } else {
                    if (text.includes('Logging in user')) {
                        hasTriedToLogin = true;

                        setTimeout(() => {
                            this.on('steamGuardSent' as LoginEvents, (code: string) => {
                                stdin.write(`${code}\n`);
                            });
                            this.emit('steamGuardRequired' as LoginEvents);
                        }, 7 * 1000);
                    }
                }
            });
        });
    }
}

export type LoginEvents = 'steamGuardRequired' | 'steamGuardSent';