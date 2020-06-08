import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import Config from '../../src/config';
import { EModType } from '../../src/enums/eModType';
import Filesystem from '../../src/filesystem';
import IMod from '../../src/interfaces/iMod';
import Mod from '../../src/mod';
import Processor from '../../src/processor';

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

describe('Processor.updateKeys()', () => {
    test('It will move a key from the mod directory', () => {
        // Make server dir
        const tmpServerDir = path.join(os.tmpdir(), 'magma/server');
        fs.mkdirpSync(tmpServerDir);

        // Make our existing fake key
        const oldKey = path.join(tmpServerDir, 'keys/myfakekey.bikey');
        fs.mkdirpSync(path.join(tmpServerDir, 'keys'));
        fs.writeFileSync(oldKey, 'someData');

        // Mock Config.get so it returns only the temp server dir
        const orgGet = Config.get;
        Config.get = jest.fn().mockReturnValue(tmpServerDir);

        // Create a fake mod
        const mod: IMod = {
            isLocal: false,
            type: EModType.all,
            keys: [
                oldKey
            ]
        } as IMod;

        // Create our workshop file directory
        const workshopDir = Mod.getInstalledPath(mod);
        const modKeys = path.join(workshopDir, 'keys');
        const newKey = path.join(modKeys, 'mynewkey.bikey');
        fs.mkdirpSync(modKeys);
        fs.writeFileSync(newKey, 'newData');

        // Test our code
        const mods = Processor.updateKeys([mod]);

        expect(mods[0]).toStrictEqual({
            isLocal: false,
            type: EModType.all,
            keys: [
                path.join(tmpServerDir, 'keys/mynewkey.bikey')
            ]
        });

        expect(fs.existsSync(oldKey)).toBe(false);
        expect(fs.existsSync(path.join(tmpServerDir, 'keys/mynewkey.bikey'))).toBe(true);

        Config.get = orgGet;
    });
});

describe('Processor.linkMods() & Processor.unlinkMod() * Processor.pruneWorkshopContents()', () => {
    test('It creates a symlink + removes its symlinks + the workshop contents', () => {
        // Fake server dir
        const tmpServerDir = path.join(os.tmpdir(), 'magma/symlink');
        fs.mkdirpSync(tmpServerDir);

        // Return our server dir from Config
        const orgGet = Config.get;
        Config.get = jest.fn().mockReturnValue(tmpServerDir);

        // Make our fake workshop mods
        const mods: IMod[] = [
            { name: 'Required Mod', type: EModType.all, isActive: true },
            { name: 'Server Mod', type: EModType.server, isActive: true },
            { name: 'Client Mod', type: EModType.client, isActive: true }
        ] as IMod[];

        // Make dirs for our fake mods
        const requiredDirSW = Mod.getInstalledPath(mods[0]);
        const serverDirSW = Mod.getInstalledPath(mods[1]);
        const clientDirSW = Mod.getInstalledPath(mods[2]);

        fs.mkdirpSync(requiredDirSW);
        fs.mkdirpSync(serverDirSW);
        fs.mkdirpSync(clientDirSW);

        Processor.linkMods(mods);

        const requiredDir = path.join(tmpServerDir, 'mods/@required_mod');
        const serverDir = path.join(tmpServerDir, 'servermods/@server_mod');

        expect(fs.existsSync(requiredDir)).toBe(true);
        expect(fs.existsSync(serverDir)).toBe(true);
        expect(fs.existsSync(path.join(tmpServerDir, 'mods/@client_mod'))).toBe(false);

        expect(fs.lstatSync(requiredDir).isSymbolicLink()).toBe(true);
        expect(fs.lstatSync(serverDir).isSymbolicLink()).toBe(true);

        // Unlink mods
        for (const mod of mods) {
            Processor.unlinkMod(mod);
        }

        expect(fs.existsSync(requiredDir)).toBe(false);
        expect(fs.existsSync(serverDir)).toBe(false);

        // Remove workshop contents
        for (const mod of mods) {
            Processor.pruneWorkshopContents(mod);
        }

        expect(fs.existsSync(requiredDirSW)).toBe(false);
        expect(fs.existsSync(serverDirSW)).toBe(false);
        expect(fs.existsSync(clientDirSW)).toBe(false);

        Config.get = orgGet;
    });
});

describe('Processor.updateServerConfigFile()', () => {
    test('It updates the LinuxGSM config', () => {
        // Mock our platform because it will exit on Windows
        const orgPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'linux',
        });

        // Mock Config.get('linuxGSM')
        fs.mkdirpSync(path.join(os.tmpdir(), 'magma/linuxGsm'));
        const linuxConfig = path.join(os.tmpdir(), 'magma/linuxGsm/config.cfg');

        const orgGet = Config.get;
        Config.get = jest.fn().mockReturnValue(linuxConfig);

        // Create our fake LinuxGSM config with two mods already in there + a commented line
        const orgConfig = [
            '#mods="somemod"',
            'mods="mods/@required_mod\;"',
            'servermods="servermods/@server_mod\;"',
        ].join('\n');

        fs.writeFileSync(linuxConfig, orgConfig);

        // Fake two mods (one servermod, one required mod)
        const mods: IMod[] = [
            { name: 'Required Mod New', type: EModType.all, isActive: true },
            { name: 'Server Mod New', type: EModType.server, isActive: true }
        ] as IMod[];

        // Test our code
        Processor.updateServerConfigFile(mods);

        // Check that the config file got updated correctly
        const configText = fs.readFileSync(linuxConfig).toString().replace(/[\r]/g, '').trim().split('\n');
        expect(configText).toStrictEqual([
            '#mods="somemod"',
            'mods="mods/@required_mod_new\\;"',
            'servermods="servermods/@server_mod_new\\;"',
        ]);

        // Clear up our mocks
        Object.defineProperty(process, 'platform', {
            value: orgPlatform,
        });
        Config.get = orgGet;
    });
});
