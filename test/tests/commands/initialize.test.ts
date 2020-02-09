import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import InitializeCommand from '../../../src/commands/initialize';
import Config from '../../../src/config';
import SteamCmd from '../../../src/steam/steamCmd';
import setupCommand from '../../setup';

let orgPath: any;
let file: string;

describe('Initialize.run()', () => {
    beforeAll(() => {
        setupCommand();

        orgPath = Config['path'];

        fs.mkdirsSync(path.join(os.tmpdir(), 'magmaInitTest'));

        file = path.join(os.tmpdir(), 'magmaInitTest/exampleMagma.json');

        Config['path'] = jest.fn().mockReturnValue(file);
    });

    afterAll(() => {
        if (fs.existsSync(file)) {
            fs.removeSync(file);
        }

        Config['path'] = orgPath;
    });

    test('Command runs in non interactive mode', async () => {
        const mock = jest.spyOn(SteamCmd, 'login').mockResolvedValue(true);
        const configMock = jest.spyOn(Config, 'setAll');

        const gsmPath = path.join(os.tmpdir(), 'magmaInitTest/gsm.config');
        const serverPath = path.join(os.tmpdir(), 'magmaInitTest');
        const cmdPath = path.join(os.tmpdir(), 'magmaInitTest/steamcmd');

        fs.writeFileSync(gsmPath, 'gsmConfig');
        fs.writeFileSync(path.join(serverPath, 'arma3server'), 'arma3serverExecutable');
        fs.writeFileSync(cmdPath, 'thisIsSteam');

        const args = ['-n', `-l${gsmPath}`, '-ppassword', `-s${serverPath}`, `-c${cmdPath}`, `-uusername`];

        await InitializeCommand.run(args);

        expect(mock).toHaveBeenCalledTimes(1);

        expect(configMock).toHaveBeenLastCalledWith({
            credentials: {
                password: jasmine.any(String),
                username: 'username',
            },
            key: jasmine.any(String),
            linuxGsm: gsmPath,
            mods: [],
            serverPath,
            steamCmdPath: cmdPath,
            cronMessages: [],
        });

        if (fs.existsSync(gsmPath)) { fs.removeSync(gsmPath); }
        if (fs.existsSync(cmdPath)) { fs.removeSync(cmdPath); }
        if (fs.existsSync(path.join(serverPath, 'arma3server'))) {
            fs.removeSync(path.join(serverPath, 'arma3server'));
        }

        mock.mockRestore();
        configMock.mockRestore();
    });
});
