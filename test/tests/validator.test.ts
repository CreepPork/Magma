import Validator from '../../src/validator';
import SteamCmd from '../../src/steam/steamCmd';
import Encrypter from '../../src/encrypter';

describe('Validator.steamCmd', () => {
    test('Passing invalid path will return false', () => {
        const validate = new Validator(true);

        expect(validate.steamCmd('some/random/non/existant')).toBe(false);
    });
});

describe('Validator.server', () => {
    test('Passing invalid path will return false', () => {
        const validate = new Validator(true);

        expect(validate.server('some/random/non/existant')).toBe(false);
    });
});

describe('Validator.credentials', () => {
    test('Passing invalid credentials in non-interactive mode will throw', async () => {
        const validate = new Validator(true);
        const enMock = jest.spyOn(Encrypter.prototype, 'encrypt').mockReturnValue('random');
        const mock = jest.spyOn(SteamCmd, 'login').mockResolvedValue(false);

        expect(validate.credentials(
            { username: 'hello', password: 'world' },
            'someKey',
            'some/path'
        )).rejects.toEqual(
            new Error('Failed to login. Did you provide the username and the password (guard code) correcly?')
        );

        mock.mockRestore();
        enMock.mockRestore();
    });
});
