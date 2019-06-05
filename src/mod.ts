import Settings from './settings';
import SteamApi from './steam/api';

import * as inquirer from 'inquirer';
import * as _ from 'lodash';

export default class Mod {
    public static async generateModFromId(appId: number, itemId: number): Promise<IMod> {
        const mods = Settings.get('mods');

        // Find if item already exists in mod list in magma.json
        const existingMod = _.find(mods, { itemId });

        if (existingMod) {
            return existingMod;
        }

        // If not gen a new mod and append to magma.json
        const data = await SteamApi.getPublishedItemDetails(itemId);
        const name = data.response.publishedfiledetails[0].title;

        let isServerMod = false;
        let isClientSideMod = false;

        const isRequired: { forAll: boolean } = await inquirer.prompt({
            default: true,
            message: `Is ${name} required for all clients?`,
            name: 'forAll',
            type: 'confirm',
        });

        if (! isRequired.forAll) {
            const isMod: { type: string[] } = await inquirer.prompt({
                choices: ['Server-side mod', 'Client-side mod'],
                message: `Is ${name} a`,
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

        const mod = {
            gameId: appId,
            isClientSideMod,
            isServerMod,
            itemId,
            name: data.response.publishedfiledetails[0].title,
            updatedAt: data.response.publishedfiledetails[0].time_updated,
        };

        mods.push(mod);
        Settings.write('mods', mods);

        return mod;
    }
}

export interface IMod {
    gameId: number;
    itemId: number;
    name: string;
    isClientSideMod: boolean;
    isServerMod: boolean;
    keys?: string[];
    updatedAt?: number;
}

export const popularMods: IMod[] = [
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 463939057,
        name: 'ace',
    },
    {
        gameId: 107410,
        isClientSideMod: true,
        isServerMod: false,
        itemId: 723217262,
        name: 'Achilles',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: true,
        itemId: 713709341,
        name: 'Advanced Rappelling',
    },
    {
        gameId: 107410,
        isClientSideMod: true,
        isServerMod: false,
        itemId: 450814997,
        name: 'CBA_A3',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 583496184,
        name: 'CUP Terrains - Core',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 583544987,
        name: 'CUP Terrains - Maps',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 497661914,
        name: 'CUP Units',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 541888371,
        name: 'CUP Vehicles',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 497660133,
        name: 'CUP Weapons',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 843425103,
        name: 'RHSAFRF',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 843593391,
        name: 'RHSGREF',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 843632231,
        name: 'RHSSAF',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 843577117,
        name: 'RHSUSAF',
    },
    {
        gameId: 107410,
        isClientSideMod: false,
        isServerMod: false,
        itemId: 620019431,
        name: 'task_force_radio',
    },
];
