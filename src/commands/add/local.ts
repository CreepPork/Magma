import Command, { flags as flag } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';
import { prompt } from 'inquirer';
import * as _ from 'lodash';
import * as path from 'path';
import Config from '../../config';
import { EModType } from '../../enums/eModType';
import Filesystem from '../../filesystem';
import { nonInteractive } from '../../flags';
import IMod from '../../interfaces/iMod';
import Mod from '../../mod';

export default class AddLocalCommand extends Command {
    public static description = 'Adds local mods to the configuration files.';
    public static examples = [
        'magma add:local /home/arma/@client --type client',
        'magma add:local /home/arma/@all /home/arma/@client /home/arma/@server --type all client server',
    ];
    public static strict = false;
    public static args = [{ description: 'File paths.', name: 'paths', required: true }] as IArg[];
    public static flags = {
        nonInteractive,
        type: flag.string({
            char: 't',
            default: 'all',
            multiple: true,
            options: ['all', 'client', 'server'],
        }),
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
        Config.ensureIsLatestVersion();
    }

    public async run(): Promise<void> {
        const { argv, flags } = this.parse(AddLocalCommand);

        const configMods = Config.get('mods');

        // Get info from API
        const mods: IMod[] = [];
        const types: (keyof typeof EModType)[] = flags.type as any;

        for (const [index, dir] of argv.entries()) {
            if (!Filesystem.isDirectory(dir, true)) {
                throw new Error(`Mod (path: ${dir}) does not exist or is not a directory.`);
            }

            // The mod should be in the server directory because we don't store the location
            // And copying is too risky.
            if (path.join(dir, '../..') !== Config.get('serverPath')) {
                throw new Error(`Mod (path: ${dir}) must be placed one level deep inside the server directory (e.g. mods or servermods directory).`);
            }

            const filename = Filesystem.getFilename(dir);
            const name = filename.substring(1);

            // This prevents issues later when we have to look up the mod directory in other commands
            if (`@${_.snakeCase(name)}` !== filename && filename === `@${name}`) {
                throw new Error(`Mod (path: ${dir}) with folder name ${name} should be named @${_.snakeCase(name)}.`)
            }

            let type: EModType | undefined = EModType[types[index]];

            if (type === undefined) {
                if (flags.nonInteractive) {
                    throw new Error(`Mod (path: ${dir}) was not given a type. Did you enter the type with --type?`);
                }

                type = await this.promptForType(dir);
            }

            if (type === EModType.client && path.join(dir, '..') !== 'clientmods') {
                throw new Error('Local client-side mods should be placed in a `clientmods` directory.');
            }

            if (configMods.find(mod => mod.name === name) === undefined) {
                mods.push({
                    id: Mod.generateModId(),
                    isActive: true,
                    isLocal: true,
                    name,
                    type,
                });
            }
        }

        // Enforce unique mod names (remove command needs unique names)
        const modNames = mods.map(mod => mod.name);
        if (_.uniq(modNames).length !== modNames.length) {
            throw new Error('There are mods that have duplicate names. Mod names must be unique.');
        }

        if (mods.length === 0) {
            console.log('The given mods have already been added to the configuration file.');
        } else {
            configMods.push(...mods);
            Config.set('mods', configMods);
        }
    }

    private async promptForType(dir: string): Promise<EModType> {
        const choices = ['Required for all', 'Client-side only', 'Server-side only'];

        const response: { type: string } = await prompt({
            choices,
            message: `What type of mod is ${dir}?`,
            name: 'type',
            type: 'list',
        });

        return choices.indexOf(response.type);
    }
}
