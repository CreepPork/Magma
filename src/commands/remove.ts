import Command from '../command';
import { IMod } from '../mod';
import Settings from '../settings';

import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as path from 'path';

import ora from 'ora';

export default class Remove extends Command {
    public static description = 'Removes selected mods from disk completely and their keys.';

    public async run() {
        this.checkIfInitialized();

        const allMods = Settings.get('mods');

        const modsTo: { remove: string[] } = await inquirer.prompt({
            choices: allMods,
            message: 'Which mods do you want to remove?',
            name: 'remove',
            type: 'checkbox',
            validate: mods => mods.length > 0,
        });

        const serverDir = Settings.get('gameServerPath');

        for (const name of modsTo.remove) {
            const spinner = ora(`Removing mod ${name}`).start();
            const mod = _.find(allMods, { name }) as IMod;

            if (mod.keys) {
                for (const key of mod.keys) {
                    if (fs.existsSync(key)) {
                        fs.unlinkSync(key);
                    }
                }
            }

            const steamPath = path.join(serverDir, `steamapps/workshop/content/${mod.gameId}/${mod.itemId}`);

            if (fs.existsSync(steamPath)) {
                fs.removeSync(steamPath);
            }

            const modPath = path.join(serverDir, 'mods', _.snakeCase(mod.name));

            if (fs.existsSync(modPath)) {
                fs.removeSync(modPath);
            }

            const serverModPath = path.join(serverDir, 'servermods', _.snakeCase(mod.name));

            if (fs.existsSync(serverModPath)) {
                fs.removeSync(serverModPath);
            }

            _.remove(allMods, mod);

            spinner.succeed();
        }

        Settings.write('mods', allMods);
    }
}
