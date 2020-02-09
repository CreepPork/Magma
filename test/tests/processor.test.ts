import * as path from 'path';

import Processor from '../../src/processor';
import Server from '../../src/constants/server';
import Filesystem from '../../src/filesystem';
import IMod from '../../src/interfaces/iMod';

describe('Processor.getWorkshopModPath()', () => {
    test('Returns correct path', () => {
        // @ts-ignore Private property
        const old = Processor.serverPath;
        // @ts-ignore Private property
        Processor.serverPath = 'path';

        expect(Processor.getWorkshopModPath(1)).toBe(
            path.join(`path/steamapps/workshop/content/${Server.id}/1`)
        );

        // @ts-ignore Private property
        Processor.serverPath = old;
    });
});

describe('Processor.renameModsToLower()', () => {
    test('Exits for Windows', () => {
        const orgPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'win32',
        });

        const mock = jest.spyOn(Filesystem, 'renameContentsToLowercase');

        Processor.renameModsToLower([{ id: 0 } as IMod]);

        expect(mock).not.toHaveBeenCalled();

        mock.mockRestore();
        Object.defineProperty(process, 'platform', {
            value: orgPlatform,
        });
    });

    test('Calls Filesystem.renameContentsToLowercase for each mod', () => {
        const orgPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'linux',
        });

        const mock = jest.spyOn(Filesystem, 'renameContentsToLowercase').mockReturnValue(undefined);
        const dirMock = jest.spyOn(Processor, 'getWorkshopModPath').mockReturnValue('some/path');

        Processor.renameModsToLower([{ id: 0 } as IMod]);

        expect(mock).toHaveBeenCalled();

        mock.mockRestore();
        dirMock.mockRestore();
        Object.defineProperty(process, 'platform', {
            value: orgPlatform,
        });
    });
});
