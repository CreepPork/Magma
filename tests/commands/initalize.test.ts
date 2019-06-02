import Initialize from '../../src/commands/initialize';
import { popularMods } from '../../src/popularMods';
import Settings from '../../src/settings';

import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';

jest.mock('inquirer');

test('Command runs', async () => {
    if (Settings.fileExists()) {
        // @ts-ignore
        fs.unlinkSync(Settings.getFile());
    }

    const mock = jest.spyOn(inquirer, 'prompt')
        .mockResolvedValueOnce({ mods: popularMods })
        .mockResolvedValueOnce({ add: false });

    await Initialize.run();

    expect(mock).toBeCalledTimes(2);

    mock.mockRestore();
});
