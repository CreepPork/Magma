import Processor from '../../src/processor';
import Filesystem from '../../src/filesystem';
import IMod from '../../src/interfaces/iMod';
import Mod from '../../src/mod';

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
        const dirMock = jest.spyOn(Mod, 'getInstalledPath').mockReturnValue('some/path');

        Processor.renameModsToLower([{ id: 0 } as IMod]);

        expect(mock).toHaveBeenCalled();

        mock.mockRestore();
        dirMock.mockRestore();
        Object.defineProperty(process, 'platform', {
            value: orgPlatform,
        });
    });
});
