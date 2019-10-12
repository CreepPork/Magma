import * as Crypto from 'crypto';

import IEncryptedPayload from './interfaces/iEncryptedPayload';

/**
 * Based on Laravel's implementation.
 */
export default class Encrypter {
    /**
     * Default cipher to be used is AES-256-CBC.
     */
    public static readonly DEFAULT_CIPHER = 'AES-256-CBC';

    /**
     * Determine if the given key and cipher combination is valid.
     */
    public static supported(key: string, cipher: string): boolean {
        const length = Buffer.byteLength(key, 'base64');

        return (cipher === 'AES-128-CBC' && length === 16) ||
            (cipher === 'AES-256-CBC' && length === 32);
    }

    /**
     * Create a new encryption key for the given cipher.
     */
    public static generateKey(cipher = this.DEFAULT_CIPHER): string {
        return Crypto.randomBytes(cipher === 'AES-128-CBC' ? 16 : 32).toString('base64');
    }

    /**
     * For AES it is always 16.
     */
    private static readonly IV_LENGTH = 16;

    /**
     * The encryption key.
     */
    private key: string;

    /**
     * The algorithm used for encryption.
     */
    private cipher: string;

    /**
     * Create a new encrypter instance.
     */
    constructor(key: string, cipher = Encrypter.DEFAULT_CIPHER) {
        if (Encrypter.supported(key, cipher)) {
            this.key = key;
            this.cipher = cipher;
        } else {
            throw new Error('The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths.');
        }
    }

    /**
     * Encrypt the given value.
     */
    public encrypt(data: any, stringify = true): string {
        const iv = Crypto.randomBytes(Encrypter.IV_LENGTH);

        /**
         * First we will encrypt the value using OpenSSL. After this is encrypted we
         * will proceed to calculating a MAC for the encrypted value so that this
         * value can be verified later as not having been changed by the users.
         */
        const cipher = Crypto.createCipheriv(this.cipher, Buffer.from(this.key, 'base64'), iv);
        let encrypted = cipher.update(stringify ? JSON.stringify(data) : data);

        encrypted = Buffer.concat([encrypted, cipher.final()]);

        /**
         * Once we get the encrypted value we'll go ahead and base64_encode the input
         * vector and create the MAC for the encrypted value so we can then verify
         * its authenticity. Then, we'll JSON the data into the "payload" array.
         */
        const mac = this.hash(iv.toString(), encrypted.toString());

        const payload: IEncryptedPayload = { iv, encrypted, mac };
        const json = JSON.stringify(payload);

        return Buffer.from(json).toString('base64');
    }

    /**
     * Decrypt the given value.
     */
    public decrypt(payload: string, unserialize = true): any {
        const json = this.getJsonPayload(payload);

        const iv = Buffer.from(json.iv);

        const decipher = Crypto.createDecipheriv(this.cipher, Buffer.from(this.key, 'base64'), iv);

        const decryptedBuffer = decipher.update(Buffer.from(json.encrypted));
        const decrypted = Buffer.concat([decryptedBuffer, decipher.final()]).toString();

        return unserialize ? JSON.parse(decrypted) : decrypted;
    }

    /**
     * Create a MAC for the given value.
     */
    private hash(iv: string, value: string): string {
        return Crypto.createHmac('sha256', this.key).update(iv + value).digest('hex');
    }

    /**
     * Get the JSON array from the given payload.
     */
    private getJsonPayload(payload: string): IEncryptedPayload {
        const json = JSON.parse(Buffer.from(payload, 'base64').toString());

        if (! this.validPayload(json)) {
            throw new Error('The payload is invalid.');
        }

        if (! this.validMac(json)) {
            throw new Error('The MAC is invalid.');
        }

        return json;
    }

    /**
     * Verify that the encryption payload is valid.
     */
    private validPayload(payload: IEncryptedPayload | any): boolean {
        return typeof payload === 'object' && payload.iv && payload.encrypted && payload.mac &&
            Buffer.from(payload.iv, 'base64').length === Encrypter.IV_LENGTH;
    }

    /**
     * Determine if the MAC for the given payload is valid.
     */
    private validMac(payload: IEncryptedPayload): boolean {
        const bytes = Crypto.randomBytes(Encrypter.IV_LENGTH);

        const comparision = Crypto.createHmac(
            'sha256',
            bytes,
        ).update(payload.mac).digest('hex');

        const calculated = this.calculateMac(payload, bytes);

        return Crypto.timingSafeEqual(
            Buffer.from(comparision),
            Buffer.from(calculated),
        );
    }
    /**
     * Calculate the hash of the given payload.
     */
    private calculateMac(payload: IEncryptedPayload, bytes: Buffer): string {
        return Crypto.createHmac(
            'sha256',
            bytes,
        ).update(this.hash(
            Buffer.from(payload.iv as any, 'base64').toString(), Buffer.from(payload.encrypted).toString(),
        )).digest('hex');
    }
}
