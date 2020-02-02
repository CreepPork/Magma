import { prompt } from 'inquirer';

import IMod from './interfaces/iMod';

export default class Insurers {
    public static async ensureValidIds(mods: IMod[], noInteraction: boolean, message: string): Promise<number[]> {
        const ids = [];

        if (noInteraction) {
            throw new Error(
                'Steam Workshop item IDs have to be specified as arguments when running in non interactive mode.',
            );
        } else {
            const choices = mods.map(mod => mod.name);

            const response: { mods: string[] } = await prompt({
                choices,
                message,
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
