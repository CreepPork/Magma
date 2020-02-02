import { Hmac } from 'crypto';

export default interface IEncryptedPayload {
    iv: Buffer;
    encrypted: Buffer;
    mac: string;
}
