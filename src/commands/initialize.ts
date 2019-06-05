import { flags } from '@oclif/command';
import axios, { AxiosResponse } from 'axios';
import ora from 'ora';
import Command from '../command';

import File from '../file';
import { ISteamPublishedFile } from '../interfaces/steamPublishedFile';
import { IMod, popularMods } from '../popularMods';
import { ISupportedServer, supportedServers } from '../servers';
import Settings, { ISettings } from '../settings';
import Login from './login';

import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as qs from 'qs';

export default class Initialize extends Command {
    public static description = 'Initializes servers configuration data.';
    public static aliases = [
        'init',
    ];

    public static flags = {
        force: flags.boolean({
            char: 'f',
            description: 'Skip a check if the settings file already exists.',
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

            for (const mod of selectedMods.mods) {
                const value = _.find(popularMods, { name: mod });

                if (value) {
                    mods.push(value);
                }
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

                const id = mod.url.match(RegExp(/([0-9])\w+/g)) as RegExpMatchArray;
                const axiosSpinner = ora('Fetching info');

                try {
                    axiosSpinner.start();
                    const request: AxiosResponse<ISteamPublishedFile> = await axios.post(
                        'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                        qs.stringify({
                            'itemcount': 1,
                            'publishedfileids[0]': id.toString(),
                        }), {
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded',
                            },
                        },
                    );

                    axiosSpinner.succeed();

                    mods.push({
                        gameId: serverType.gameAppId,
                        itemId: parseInt(id.toString(), 10),
                        name: request.data.response.publishedfiledetails[0].title,
                    });
                } catch (error) {
                    axiosSpinner.fail();
                    this.warn('Failed to retrieve data from Steam Workshop. Adding only ID.');

                    mods.push({
                        gameId: serverType.gameAppId,
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
