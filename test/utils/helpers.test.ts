import * as fs from 'fs-extra';

import Helpers from '../../src/helpers';

describe('Helpers.ensureIsInitialized()', () => {
    test('Error is thrown if magma.json does not exist', () => {
        Object.defineProperty(fs, 'existsSync', { value: jest.fn() });
        const mock = fs.existsSync as jest.Mock;

        mock.mockReturnValue(false);

        expect(() => Helpers.ensureIsInitialized()).toThrowError(
            new Error('Magma is not initialized. Run `magma init` to initialize your project.')
        );
    });

    test('No error is thrown if magma.json exists', () => {
        Object.defineProperty(fs, 'existsSync', { value: jest.fn() });
        const mock = fs.existsSync as jest.Mock;

        mock.mockReturnValue(true);

        expect(() => Helpers.ensureIsInitialized()).not.toThrow();
    });
});
