import nock = require('nock');

import ISteamRemoteStorage from '../../src/interfaces/iSteamRemoteStorage';
import Mod from '../../src/mod';
import ISteamMod from '../../src/interfaces/iSteamMod';

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

describe('Mod.generateModsFromApi()', () => {
    test('Given two mods it correctly forms the correct output', async () => {
        const mods: ISteamMod[] = [
            { id: 12, steamId: 12, name: 'Mod 1', type: 0, isActive: true, isLocal: false },
            { id: 23, steamId: 23, name: 'Mod 2', type: 1, isActive: true, isLocal: false }
        ];

        const fetched = await Mod.generateModsFromApi(
            mods.map(mod => ({ id: mod.id, steamId: mod.steamId, type: mod.type })),
        );

        expect(fetched).toStrictEqual([
            { id: 12, steamId: 12, name: 'Mod 1', type: 0, isActive: true, isLocal: false }, { id: 23, steamId: 23, name: 'Mod 2', type: 1, isActive: true, isLocal: false },
        ]);
    });
});
