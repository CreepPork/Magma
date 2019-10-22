import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import Command from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';

import { prompt } from 'inquirer';

import Config from '../config';
import { EModType } from '../enums/eModType';
import { nonInteractive } from '../flags';
import Processor from '../processor';

export default class RemoveCommand extends Command {
    public static description = 'Removes mod files from disk.';
    public static examples = [
        'magma remove',
        'magma remove 723217262',
        'magma remove 450814997 723217262 713709341',
    ];
    public static strict = false;
    public static args = [{ description: 'Steam Workshop item IDs.', name: 'id' }] as IArg[];
    public static flags = {
        nonInteractive,
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const { argv, flags } = this.parse(RemoveCommand);
        let ids = argv.map(arg => parseInt(arg, 10));

        const mods = Config.get('mods');
        const serverPath = Config.get('serverPath');

        if (ids.length === 0) {
            ids = await this.ensureValidIds(flags.nonInteractive);
        }

        for (const id of ids) {
            const mod = mods[mods.findIndex(m => m.id === id)];

            // Remove mod keys
            if (mod.keys) {
                for (const key of mod.keys) {
                    if (fs.existsSync(key)) {
                        fs.removeSync(key);
                    }
                }
            }

            const steamPath = Processor.getWorkshopModPath(id);

            // Remove symlink
            if (mod.type !== EModType.client) {
                const linkPath = path.join(
                    serverPath,
                    mod.type === EModType.all ? 'mods' : 'servermods',
                    `@${_.snakeCase(mod.name)}`,
                );

                if (fs.existsSync(linkPath)) {
                    fs.removeSync(linkPath);
                }
            }

            // Remove workshop contents
            if (fs.existsSync(steamPath)) {
                fs.removeSync(steamPath);
            }

            // Remove from config
            _.remove(mods, m => m.id === id);
        }

        Processor.updateServerConfigFile(
            mods.filter(mod => mod.type === EModType.all),
            mods.filter(mod => mod.type === EModType.server),
        );

        Config.set('mods', mods);
    }

    private async ensureValidIds(noInteraction: boolean): Promise<number[]> {
        const mods = Config.get('mods');
        const ids = [];

        if (noInteraction) {
            throw new Error(
                'Steam Workshop item IDs have to be specified as arguments when running in non interactive mode.',
            );
        } else {
            const choices = mods.map(mod => mod.name);

            const response: { mods: string[] } = await prompt({
                choices,
                message: 'Which mod would you like to remove?',
                name: 'mods',
                type: 'checkbox',
                validate: list => list.length > 0,
            });

            for (const name of response.mods) {
                const index = mods.findIndex(mod => mod.name === name);

                ids.push(mods[index].id);
            }
        }

        return ids;
    }
}
