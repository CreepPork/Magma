import Server from '../../src/constants/server';

describe('Server.ts', () => {
    test('App ID matches Arma 3 on Steam', () => {
        const id = 107410;

        expect(Server.id).toBe(id);
        expect(Server.executable).toBe('arma3server');
    });
});
