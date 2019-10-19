import nock = require('nock');

import ISteamRemoteStorage from '../../src/interfaces/iSteamRemoteStorage';
import SteamApi from '../../src/steam/steamApi';

const baseUrl = 'https://api.steampowered.com';
const apiUrl = '/ISteamRemoteStorage/GetPublishedFileDetails/v1/';

describe('SteamApi.getPublishedItem()', () => {
    test('It returns one item and calls .getPublishedItems()', async () => {
        const mock = jest.spyOn(SteamApi, 'getPublishedItems').mockResolvedValue([
            { publishedfileid: 1234 } as any,
        ]);

        expect(await SteamApi.getPublishedItem(1234)).toStrictEqual({ publishedfileid: 1234 });
        expect(mock).toHaveBeenCalledTimes(1);

        mock.mockRestore();
    });
});

describe('SteamApi.getPublishedItems()', () => {
    test('One item can be returned from the API', async () => {
        const reply: ISteamRemoteStorage = {
            response: { publishedfiledetails: [{ result: 1, publishedfileid: 12 } as any], result: 1, resultcount: 1 },
        };

        nock(baseUrl).post(apiUrl).reply(200, reply);

        expect(await SteamApi.getPublishedItems(12)).toStrictEqual(reply.response.publishedfiledetails);
    });

    test('Multiple items can be returned from the API', async () => {
        const reply: ISteamRemoteStorage = {
            response: {
                publishedfiledetails: [
                    { result: 1, publishedfileid: 12 }, { result: 1, publishedfiledetails: 5432 },
                ] as any[],
                result: 1,
                resultcount: 2,
            },
        };

        nock(baseUrl).post(apiUrl).reply(200, reply);

        expect(await SteamApi.getPublishedItems(12, 5432)).toStrictEqual(reply.response.publishedfiledetails);
    });

    test('When a non-existant item is returned, it rejects', async () => {
        const reply: ISteamRemoteStorage = {
            response: { publishedfiledetails: [{ result: 9, publishedfileid: 12 } as any], result: 1, resultcount: 1 },
        };

        nock(baseUrl).post(apiUrl).reply(200, reply);

        try {
            await SteamApi.getPublishedItems(-1);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test('When an item with an unknown status code is returned, it rejects', async () => {
        const reply: ISteamRemoteStorage = {
            response: { publishedfiledetails: [{ result: 99, publishedfileid: 12 } as any], result: 1, resultcount: 1 },
        };

        nock(baseUrl).post(apiUrl).reply(200, reply);

        try {
            await SteamApi.getPublishedItems(-1);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
