import nock = require('nock');

import IMod from '../../src/interfaces/iMod';
import ISteamRemoteStorage from '../../src/interfaces/iSteamRemoteStorage';
import Mod from '../../src/mod';

beforeAll(() => {
    const data: ISteamRemoteStorage = {
        response: {
            publishedfiledetails: [{ result: 1, title: 'Mod 1' }, { result: 1, title: 'Mod 2' }] as any[],
            result: 1,
            resultcount: 2,
        },
    };

    nock('https://api.steampowered.com').post('/ISteamRemoteStorage/GetPublishedFileDetails/v1/')
        .reply(200, data);
});

describe('Mod.getModFromApi()', () => {
    test('Returns first item and calls .getModsFromApi()', async () => {
        const mock = jest.spyOn(Mod, 'getModsFromApi').mockResolvedValue([{ id: 1234 } as any]);

        expect(await Mod.getModFromApi(1234, 0)).toStrictEqual({ id: 1234 });
        expect(mock).toHaveBeenCalledTimes(1);

        mock.mockRestore();
    });
});

describe('Mod.getModsFromApi()', () => {
    test('If empty mod array was passed, then it exits', async () => {
        expect(await Mod.getModsFromApi()).toStrictEqual([]);
    });

    test('Given two mods it correctly forms the correct output', async () => {
        const mods: IMod[] = [{ id: 12, name: 'Mod 1', type: 0}, { id: 23, name: 'Mod 2', type: 1 }];

        const fetched = await Mod.getModsFromApi(
            ...mods.map(mod => ({ id: mod.id, type: mod.type })),
        );

        expect(fetched).toStrictEqual([
            { id: 12, name: 'Mod 1', type: 0 }, { id: 23, name: 'Mod 2', type: 1 },
        ]);
    });
});
