import Settings from './settings';

import * as crypto from 'crypto';

export default class Crypto {
    private encryptionKey: string;
    private iv: string;

    constructor() {
        if (Settings.has('encryptionKey') && Settings.has('ivKey')) {
            this.encryptionKey = Settings.get('encryptionKey');
            this.iv = Settings.get('ivKey');
        } else {
            this.encryptionKey = crypto.randomBytes(16).toString('hex');
            Settings.write('encryptionKey', this.encryptionKey);

            this.iv = crypto.randomBytes(16).toString('hex');
            Settings.write('ivKey', this.iv);
        }
    }

    public encrypt(text: string): string {
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, Buffer.from(this.iv, 'hex'));
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return encrypted.toString('hex');
    }

    public decrypt(text: string): string {
        const iv = Buffer.from(this.iv, 'hex');
        const encryptedText = Buffer.from(text, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    }
}
