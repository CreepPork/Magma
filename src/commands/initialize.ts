import { Command, flags } from '@oclif/command';
import axios, { AxiosResponse } from 'axios';
import ora from 'ora';

import { ISteamPublishedFile } from '../interfaces/steamPublishedFile';
import { IMod, popularMods } from '../popularMods';
import Settings from '../settings';

import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as qs from 'qs';

export default class Initialize extends Command {
    public static description = 'Initializes servers configuration data.';
    public static aliases = [
        'init',
    ];

    public static flags = {
        force: flags.boolean({ char: 'f' }),
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

        const selectedMods: { mods: string[] } = await inquirer.prompt({
            choices: popularMods,
            message: 'Do you want any of these mods?',
            name: 'mods',
            type: 'checkbox',
        });

        const mods: IMod[] = [];

        for (const mod of selectedMods.mods) {
            const value = _.find(popularMods, { name: mod });

            if (value) {
                mods.push(value);
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

                    axiosSpinner.stop();

                    mods.push({
                        id: parseInt(id.toString(), 10),
                        name: request.data.response.publishedfiledetails[0].title,
                    });
                } catch (error) {
                    axiosSpinner.stop();
                    this.warn('Failed to retrieve data from Steam Workshop. Adding only ID.');

                    mods.push({
                        id: parseInt(id.toString(), 10),
                        name: `Unknown Addon (${id})`,
                    });
                }
            }
        }

        Settings.writeAll({ mods });
        this.log('Initialize procedure completed.');
    }
}
