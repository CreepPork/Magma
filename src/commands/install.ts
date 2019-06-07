import { flags } from '@oclif/command';

import Command from '../command';
import File from '../file';
import Settings from '../settings';
import Download from './download';

import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as path from 'path';

import ora from 'ora';

export default class Install extends Command {
    public static description = 'Installs and updates all mods that are present in your configuration file.';

    public static flags = {
        force: flags.boolean({
            char: 'f',
            default: false,
            description: 'Ignores time updated timestamps from Steam Workshop.',
        }),
    };

    public async run() {
        this.checkIfInitialized();
        // tslint:disable-next-line: no-shadowed-variable
        const { flags } = this.parse(Install);

        const settings = Settings.getAll();

        const args = settings.mods.map(mod => mod.itemId.toString());

        if (args.length === 0) {
            this.error('No mods are in your Magma JSON file.');
        }

        if (flags.force) {
            args.push('--force');
        }

        // Install and update all mods
        await Download.run(args);

        // If on Linux then find LinuxGSM config file
        if (process.platform !== 'linux') { return; }

        if (! Settings.has('linuxGsmEnabled')) {
            const doesHave: { linuxGsm: boolean } = await inquirer.prompt({
                default: true,
                message: 'Is your server installed through LinuxGSM?',
                name: 'linuxGsm',
                type: 'confirm',
            });

            if (! doesHave.linuxGsm) {
                Settings.write('linuxGsmEnabled', false);

                return;
            }

            Settings.write('linuxGsmEnabled', true);
        }

        if (! Settings.get('linuxGsmEnabled')) {
            return;
        }

        const spinner = ora('Updating LinuxGSM config file').start();

        let configPath = '';

        if (settings.instanceConfigPath) {
            if (fs.existsSync(settings.instanceConfigPath)) {
                configPath = settings.instanceConfigPath;
            }
        } else {
            let configDir = path.join(
                settings.gameServerPath,
                `../lgsm/config-lgsm/${settings.server.executableName}`,
            );

            spinner.stop();

            if (! fs.existsSync(configDir)) {
                const linuxGsmConfig: { path: string } = await inquirer.prompt({
                    message: `Config file location directory e.g. lgsm/config-lgsm/${settings.server.executableName}`,
                    name: 'path',
                    validate: (dir: string) => File.isDirectory(dir),
                });

                configDir = linuxGsmConfig.path;
            }

            const configFile: { filename: string } = await inquirer.prompt({
                choices: File.getAllFilesRecursively(configDir).map(file => File.getFilename(file)),
                message: 'Which file is for the instance settings?',
                name: 'filename',
                type: 'list',
            });

            spinner.start();

            configPath = path.join(configDir, configFile.filename);

            Settings.write('instanceConfigPath', configPath);
        }

        let allMods = settings.mods;
        const serverMods = allMods.filter(mod => mod.isServerMod);

        allMods = allMods.filter(mod => !mod.isClientSideMod && !mod.isServerMod);

        let serverModString = 'servermods="';
        let genericModString = 'mods="';

        for (const mod of allMods) {
            // LinuxGSM needs the semicolon to be escaped
            genericModString = `${genericModString}mods/@${_.snakeCase(mod.name)}\\;`;
        }

        for (const mod of serverMods) {
            serverModString = `${serverModString}servermods/@${_.snakeCase(mod.name)}\\;`;
        }

        // Close our strings
        serverModString = serverModString + '"';
        genericModString = genericModString + '"';

        // Buffer -> string -> trim \r line endings -> remove spaces -> transform into array per line
        const fileText = fs.readFileSync(configPath).toString().replace(/[\r]/g, '').trim().split('\n');

        let foundServerMods = false;
        let foundGenericMods = false;

        for (const text of fileText) {
            // If line is commented out, we don't take it into account (or it's empty)
            if (text.charAt(0) !== '#' && text !== '') {
                const index = fileText.findIndex(el => el === text);

                if (text.startsWith('servermods=')) {
                    fileText[index] = serverModString;
                    foundServerMods = true;
                }

                if (text.startsWith('mods=')) {
                    fileText[index] = genericModString;
                    foundGenericMods = true;
                }
            }
        }

        if (! foundServerMods) {
            fileText.push(serverModString);
        }

        if (! foundGenericMods) {
            fileText.push(genericModString);
        }

        const joinedText = fileText.join('\n');

        fs.writeFileSync(configPath, joinedText);

        spinner.succeed();
    }
}
