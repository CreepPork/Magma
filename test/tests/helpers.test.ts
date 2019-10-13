import * as fs from 'fs-extra';

import Config from '../../src/config';

describe('Config.ensureIsInitialized()', () => {
    test('Error is thrown if magma.json does not exist', () => {
        Object.defineProperty(fs, 'existsSync', { value: jest.fn() });
        const mock = fs.existsSync as jest.Mock;

        mock.mockReturnValue(false);

        expect(() => Config.ensureIsInitialized()).toThrowError(
            new Error('Magma is not initialized. Run `magma init` to initialize your project.'),
        );
    });

    test('No error is thrown if magma.json exists', () => {
        Object.defineProperty(fs, 'existsSync', { value: jest.fn() });
        const mock = fs.existsSync as jest.Mock;

        mock.mockReturnValue(true);

        expect(() => Config.ensureIsInitialized()).not.toThrow();
    });
});
