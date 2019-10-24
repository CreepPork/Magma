import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import List from '../../../src/commands/list';
import Config from '../../../src/config';
import { EModType } from '../../../src/enums/eModType';
import NotInitializedError from '../../../src/errors/notInitializedError';
import IMod from '../../../src/interfaces/iMod';
import Time from '../../../src/time';

import nock = require('nock');

let orgPath: any;
let file: string;

describe('List.run()', () => {
    beforeAll(() => {
        const data = {
            response: {
                publishedfiledetails: [
                    { result: 1, title: 'Mod 1', time_updated: 11 },
                    { result: 1, title: 'Mod 2', time_updated: 11 },
                    { result: 1, title: 'Mod 3', time_updated: 11 },
                ] as any[],
                result: 1,
                resultcount: 2,
            },
        };

        nock('https://api.steampowered.com').post('/ISteamRemoteStorage/GetPublishedFileDetails/v1/')
            .reply(200, data).persist();
    });

    beforeEach(() => {
        // @ts-ignore Private method
        orgPath = Config.path;

        file = path.join(os.tmpdir(), 'exampleMagma.json');

        // @ts-ignore Private method
        Config.path = jest.fn().mockReturnValue(file);

        fs.writeFileSync(file, JSON.stringify({
            mods: [],
        }));
    });

    afterEach(() => {
        if (fs.existsSync(file)) {
            fs.removeSync(file);
        }

        // @ts-ignore Private method
        Config.path = orgPath;
    });

    test('If config file does not exist, it exits.', async () => {
        const mock = jest.spyOn(Config, 'exists').mockReturnValue(false);

        // As it is a promise, async () => await List.run() .toThrow doesn't work
        try {
            await List.run();
        } catch (e) {
            expect(e).toEqual(new NotInitializedError());
        }

        mock.mockRestore();
    });

    test('If no mods were found in the config file, it exits.', async () => {
        const org = console.log;
        console.log = jest.fn();

        await List.run();

        expect(console.log).toHaveBeenCalledWith('No mods were found.');
        console.log = org;
    });

    test('Non-installed mods displays properly', async () => {
        const mods: IMod[] = [
            { id: 1234, name: 'Mod 1', type: EModType.client, updatedAt: 11, isActive: true },
            { id: 9999, name: 'Mod 2', type: EModType.all, updatedAt: 11, isActive: true },
            { id: 555, name: 'Mod 3', type: EModType.server, updatedAt: 11, isActive: true },
        ];

        fs.writeFileSync(file, JSON.stringify({ mods }));

        const org = console.log;
        console.log = jest.fn();

        await List.run();

        expect(console.log).toHaveBeenCalledTimes(1);
        console.log = org;
    });

    test('Mod with unknown type is displayed correctly', async () => {
        const mods: IMod[] = [
            { id: 1234, name: 'Mod 1', type: -5, updatedAt: 11, isActive: true },
        ];

        fs.writeFileSync(file, JSON.stringify({ mods }));

        const org = console.log;
        console.log = jest.fn();

        await List.run();

        expect(console.log).toHaveBeenCalledTimes(1);
        console.log = org;
    });

    test('Installed mods displays properly', async () => {
        // tslint:disable: object-literal-sort-keys
        const mods: IMod[] = [
            { id: 1234, name: 'Mod 1', type: EModType.client,
                keys: ['some/key/path', 'path/to/key'], updatedAt: 11, isActive: true },
            { id: 9999, name: 'Mod 2', type: EModType.all,
                keys: ['some/key/path'], updatedAt: 11, isActive: true },
            { id: 555, name: 'Mod 3', type: EModType.server,
                keys: ['some/key/path', 'path/to/key', 'more/keys'], updatedAt: 11, isActive: true },
        ];

        fs.writeFileSync(file, JSON.stringify({ mods }));

        const org = console.log;
        console.log = jest.fn();

        await List.run();

        expect(console.log).toHaveBeenCalledTimes(1);
        console.log = org;
    });
});
