import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import Config from '../../src/config';
import NotInitializedError from '../../src/errors/notInitializedError';
import OutdatedConfigurationFileError from '../../src/errors/outdatedConfigurationFileError';


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
        const orgPath = Config['path'];

        const file = path.join(os.tmpdir(), 'exampleMagma.json');

        Config['path'] = jest.fn().mockReturnValue(file);

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

        Config['path'] = orgPath;
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

describe('Config.getLatestVersion()', () => {
    test('It gets the latest version from package.json', () => {
        const result = Config.getLatestVersion();

        expect(result).not.toBeUndefined();
        expect(result).not.toBeNaN();
        expect(result).toBeGreaterThan(0);
    });
});

describe('Config.getCurrentVersion()', () => {
    test('It returns the correct config version', () => {
        const orgEnsure = Config.ensureIsInitialized;
        const orgAll = Config.getAll;

        Config.ensureIsInitialized = jest.fn().mockReturnValue(true);

        Config.getAll = jest.fn().mockReturnValue({
            version: 2,
            mods: [],
        });

        expect(Config.getCurrentVersion()).toBe(2);

        Config.ensureIsInitialized = orgEnsure;
        Config.getAll = orgAll;
    });

    test('It returns undefined if the config has no version', () => {
        const orgEnsure = Config.ensureIsInitialized;
        const orgAll = Config.getAll;

        Config.ensureIsInitialized = jest.fn().mockReturnValue(true);

        Config.getAll = jest.fn().mockReturnValue({
            mods: [],
        });

        expect(Config.getCurrentVersion()).toBeUndefined();

        Config.ensureIsInitialized = orgEnsure;
        Config.getAll = orgAll;
    });
});

describe('Config.ensureIsLatestVersion()', () => {
    const orgCurrent = Config.getCurrentVersion;
    const orgLatest = Config.getLatestVersion;

    test('It will throw error if the versions do not match', () => {
        Config.getCurrentVersion = jest.fn().mockReturnValue(undefined);
        Config.getLatestVersion = jest.fn().mockReturnValue(2);

        expect(() => Config.ensureIsLatestVersion()).toThrowError(
            new OutdatedConfigurationFileError(),
        );

        Config.getCurrentVersion = orgCurrent;
        Config.getLatestVersion = orgLatest;
    });

    test('If versions match it will not throw error', () => {
        Config.getCurrentVersion = jest.fn().mockReturnValue(2);
        Config.getLatestVersion = jest.fn().mockReturnValue(2);

        expect(() => Config.ensureIsLatestVersion()).not.toThrowError(
            new OutdatedConfigurationFileError(),
        );

        Config.getCurrentVersion = orgCurrent;
        Config.getLatestVersion = orgLatest;
    });
});
