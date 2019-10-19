import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import Config from '../../src/config';
import NotInitializedError from '../../src/errors/notInitializedError';

describe('Config.get()', () => {
    test('Returns the correct key from JSON', () => {
        const orgEnsure = Config.ensureIsInitialized;
        const orgAll = Config.getAll;

        Config.ensureIsInitialized = jest.fn().mockReturnValue(true);

        Config.getAll = jest.fn().mockReturnValue({
            key: 'someString',
            mods: [],
        });

        expect(Config.get('key')).toBe('someString');

        Config.ensureIsInitialized = orgEnsure;
        Config.getAll = orgAll;
    });
});

describe('Config.set()', () => {
    test('Data is written correctly', () => {
        // @ts-ignore Private method
        const orgPath = Config.path;

        const file = path.join(os.tmpdir(), 'exampleMagma.json');

        // @ts-ignore Private method
        Config.path = jest.fn().mockReturnValue(file);

        fs.writeFileSync(file, JSON.stringify({
            key: 'exampleTest',
            serverPath: 'some/path',
        }));

        Config.set('key', 'otherKey');

        expect(JSON.parse(fs.readFileSync(file).toString())).toStrictEqual({
            key: 'otherKey',
            serverPath: 'some/path',
        });

        if (fs.existsSync(file)) {
            fs.removeSync(file);
        }

        // @ts-ignore Private method
        Config.path = orgPath;
    });
});

describe('Config.ensureIsInitialized()', () => {
    test('Error is thrown if magma.json does not exist', () => {
        Object.defineProperty(fs, 'existsSync', { value: jest.fn() });
        const mock = fs.existsSync as jest.Mock;

        mock.mockReturnValue(false);

        expect(() => Config.ensureIsInitialized()).toThrowError(
            new NotInitializedError(),
        );
    });

    test('No error is thrown if magma.json exists', () => {
        Object.defineProperty(fs, 'existsSync', { value: jest.fn() });
        const mock = fs.existsSync as jest.Mock;

        mock.mockReturnValue(true);

        expect(() => Config.ensureIsInitialized()).not.toThrow();
    });
});
