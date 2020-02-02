import NotInitializedError from '../../src/errors/notInitializedError';

test('NotInitializedError', () => {
    expect(() => { throw new NotInitializedError(); }).toThrowError(
        new Error('Magma is not initialized. Run `magma init` to initialize your project.'),
    );
});
