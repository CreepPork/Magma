import { flags } from '@oclif/command';
import ora from 'ora';
import Command from '../command';

import File from '../file';
import { IMod, popularMods } from '../mod';
import { ISupportedServer, supportedServers } from '../servers';
import Settings, { ISettings } from '../settings';
import SteamApi from '../steam/api';
import Login from './login';

import * as inquirer from 'inquirer';
import * as _ from 'lodash';

export default class Initialize extends Command {
    public static description = 'Initializes servers configuration data.';
    public static aliases = [
        'init',
    ];

    public static flags = {
        force: flags.boolean({
            char: 'f',
            description: 'Skip the check for a settings file. If exists, it will be overwritten.',
        }),
    };

    public async run(): Promise<void> {
        // tslint:disable-next-line: no-shadowed-variable
        const { flags } = this.parse(Initialize);

        if (Settings.fileExists() && ! flags.force) {
            const settingsExist: { proceed: boolean } = await inquirer.prompt({
                default: false,
                message: 'Setting file already exists. If you proceed it will be overwritten. Proceed?',
                name: 'proceed',
                type: 'confirm',
            });

            if (! settingsExist.proceed) {
                this.exit();
            }
        }

        const server: { type: string } = await inquirer.prompt({
            choices: supportedServers,
            message: 'What server are you going to use?',
            name: 'type',
            type: 'list',
        });

        const serverType = _.find(supportedServers, { name: server.type }) as ISupportedServer;

        const steamCmd: { path: string } = await inquirer.prompt({
            message: 'Path to SteamCMD executable or script (including file itself)',
            name: 'path',
            type: 'input',
            validate: path => File.isFile(path) && File.getFilenameNoExt(path) === 'steamcmd',
        });

        const gameServer: { path: string } = await inquirer.prompt({
            message: 'Path to server directory',
            name: 'path',
            type: 'input',
            validate: path => File.isDirectory(path) && File.directoryContains(path, serverType.executableName),
        });

        const mods: IMod[] = [];
        const availableMods = popularMods.filter(mod => mod.gameId === serverType.gameAppId);

        if (availableMods.length > 0) {
            const selectedMods: { mods: string[] } = await inquirer.prompt({
                choices: availableMods,
                message: 'Do you want any of these mods?',
                name: 'mods',
                type: 'checkbox',
            });

            for (const name of selectedMods.mods) {
                const mod = _.find(popularMods, { name }) as IMod;

                if (mod.isClientSideMod) {
                    const installAsClient: { mod: boolean } = await inquirer.prompt({
                        default: true,
                        message: `${mod.name} can be a client-side mod. Install as client-side only?`,
                        name: 'mod',
                        type: 'confirm',
                    });

                    mod.isClientSideMod = installAsClient.mod;
                }

                if (mod.isServerMod) {
                    const installAsServer: { mod: boolean } = await inquirer.prompt({
                        default: true,
                        message: `${mod.name} can be a server-side mod. Install as server-side only?`,
                        name: 'mod',
                        type: 'confirm',
                    });

                    mod.isServerMod = installAsServer.mod;
                }

                mods.push(mod);
            }
        }

        const moreMods: { add: boolean } = await inquirer.prompt({
            default: true,
            message: 'Do you want to add other mods?',
            name: 'add',
            type: 'confirm',
        });

        if (moreMods.add) {
            const modsToAdd: { count: number } = await inquirer.prompt({
                default: 1,
                message: 'How many mods would you like to add?',
                name: 'count',
                type: 'number',
                validate: (num: any) => !isNaN(parseInt(num, 10)),
            });

            for (let i = 0; i < modsToAdd.count; i++) {
                const mod: { url: string } = await inquirer.prompt({
                    message: `Steam Workshop URL ${i + 1}/${modsToAdd.count}`,
                    name: 'url',
                    type: 'input',
                    validate: url => {
                        return RegExp(
                            /(https:\/\/steamcommunity.com\/(workshop|sharedfiles)\/filedetails\/\?id=[0-9])\w+/g,
                        ).test(url);
                    },
                });

                let isServerMod = false;
                let isClientSideMod = false;

                const isRequired: { forAll: boolean } = await inquirer.prompt({
                    default: true,
                    message: 'Is this mod required for all clients?',
                    name: 'forAll',
                    type: 'confirm',
                });

                if (! isRequired.forAll) {
                    const isMod: { type: string[] } = await inquirer.prompt({
                        choices: ['Server-side mod', 'Client-side mod'],
                        message: 'Is this mod a',
                        name: 'type',
                        type: 'list',
                    });

                    if (isMod.type.includes('Server-side mod')) {
                        isServerMod = true;
                    }

                    if (isMod.type.includes('Client-side mod')) {
                        isClientSideMod = true;
                    }
                }

                const id = parseInt((mod.url.match(RegExp(/([0-9])\w+/g)) as RegExpMatchArray).toString(), 10);
                const axiosSpinner = ora('Fetching info');

                try {
                    axiosSpinner.start();

                    const data = await SteamApi.getPublishedItemDetails(id);

                    axiosSpinner.succeed();

                    mods.push({
                        gameId: serverType.gameAppId,
                        isClientSideMod,
                        isServerMod,
                        itemId: parseInt(id.toString(), 10),
                        name: data.response.publishedfiledetails[0].title,
                    });
                } catch (error) {
                    axiosSpinner.fail();
                    this.warn('Failed to retrieve data from Steam Workshop. Adding only ID.');

                    mods.push({
                        gameId: serverType.gameAppId,
                        isClientSideMod,
                        isServerMod,
                        itemId: parseInt(id.toString(), 10),
                        name: `Unknown Addon (${id})`,
                    });
                }
            }
        }

        Settings.createFile();
        Settings.writeAll({
            gameServerPath: gameServer.path,
            mods,
            server: serverType,
            steamCmdPath: steamCmd.path,
        } as ISettings);

        await Login.run();

        this.log('Initialize procedure completed.');
    }
}
