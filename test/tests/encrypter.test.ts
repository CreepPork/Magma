import Encrypter from '../../src/encrypter';

let key = '';

describe('Encrypter.encrypt() & Encrypter.decrypt()', () => {
    beforeAll(() => {
        key = Encrypter.generateKey();
    });

    test('Strings can be encrypted and decrypted', () => {
        const subject = 'Hello World!';

        const cipher = new Encrypter(key);

        const encrypted = cipher.encrypt(subject);
        expect(encrypted).not.toBe(subject);

        const decrypted = cipher.decrypt(encrypted);
        expect(decrypted).toBe(subject);
    });

    test('Objects can be encrypted and decrypted', () => {
        const subject = {
            foo: 'bar',
            other: false,
        };

        const cipher = new Encrypter(key);

        const encrypted = cipher.encrypt(subject);
        expect(encrypted).not.toBe(subject);

        const decrypted = cipher.decrypt(encrypted);
        expect(decrypted).toStrictEqual(subject);

        expect(decrypted.foo).toBe(subject.foo);
    });

    test('Stringification can be turned off and strings work still fine', () => {
        const subject = 'Hello World!';

        const cipher = new Encrypter(key);

        const encrypted = cipher.encrypt(subject, false);
        expect(encrypted).not.toBe(subject);

        const decrypted = cipher.decrypt(encrypted, false);
        expect(decrypted).toBe(subject);
    });

    test('Strings can be encrypted and decrypted using non-default cipher', () => {
        const subject = 'Hello World!';

        const cipher = new Encrypter(Encrypter.generateKey('AES-128-CBC'), 'AES-128-CBC');

        const encrypted = cipher.encrypt(subject);
        expect(encrypted).not.toBe(subject);

        const decrypted = cipher.decrypt(encrypted);
        expect(decrypted).toBe(subject);
    });

    test('Error is thrown if wrong cipher is used', () => {
        expect(() => new Encrypter(key, 'Random Cipher')).toThrow();
    });

    test('Error is thrown if it finds an invalid payload', () => {
        const subject = 'Hello World!';

        const cipher = new Encrypter(key);

        cipher['validPayload'] = jest.fn().mockReturnValue(false);

        const encrypted = cipher.encrypt(subject);
        expect(encrypted).not.toBe(subject);

        expect(() => cipher.decrypt(encrypted)).toThrowError(new Error('The payload is invalid.'));
    });

    test('Error is thrown if MAC is invalid', () => {
        const subject = 'Hello World!';

        const cipher = new Encrypter(key);

        cipher['validMac'] = jest.fn().mockReturnValue(false);

        const encrypted = cipher.encrypt(subject);
        expect(encrypted).not.toBe(subject);

        expect(() => cipher.decrypt(encrypted)).toThrowError(new Error('The MAC is invalid.'));
    });
});
