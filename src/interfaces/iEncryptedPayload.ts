export default interface IEncryptedPayload {
    iv: Buffer;
    encrypted: Buffer;
    mac: string;
}
