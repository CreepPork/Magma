import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import List from '../../../src/commands/list';
import Config from '../../../src/config';
import { EModType } from '../../../src/enums/eModType';
import NotInitializedError from '../../../src/errors/notInitializedError';
import IMod from '../../../src/interfaces/iMod';
import Time from '../../../src/time';

let orgPath: string;
let file: string;

describe('List.run()', () => {
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
            { id: 1234, name: 'Mod 1', type: EModType.client },
            { id: 9999, name: 'Mod 2', type: EModType.all },
            { id: 555, name: 'Mod 3', type: EModType.server },
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
            { id: 1234, name: 'Mod 1', type: -5 },
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
                keys: ['some/key/path', 'path/to/key'], updatedAt: Time.toEpoch(new Date()) },
            { id: 9999, name: 'Mod 2', type: EModType.all,
                keys: ['some/key/path'], updatedAt: Time.toEpoch(new Date()) },
            { id: 555, name: 'Mod 3', type: EModType.server,
                keys: ['some/key/path', 'path/to/key', 'more/keys'], updatedAt: Time.toEpoch(new Date()) },
        ];

        fs.writeFileSync(file, JSON.stringify({ mods }));

        const org = console.log;
        console.log = jest.fn();

        await List.run();

        expect(console.log).toHaveBeenCalledTimes(1);
        console.log = org;
    });
});
