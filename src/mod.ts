import { EModType } from './enums/eModType';
import IMod from './interfaces/iMod';
import SteamApi from './steam/steamApi';

export default class Mod {
    public static async getModFromApi(id: number, type: EModType): Promise<IMod> {
        return (await this.getModsFromApi({ id, type }))[0];
    }

    public static async getModsFromApi(...mods: { id: number, type: EModType }[]): Promise<IMod[]> {
        if (mods.length === 0) { return []; }

        const processed: IMod[] = [];

        const items = await SteamApi.getPublishedItems(...mods.map(mod => mod.id));

        for (const [index, mod] of mods.entries()) {
            const name = items[index].title;

            processed.push({
                id: mod.id,
                isActive: true,
                name,
                type: mod.type,
            });
        }

        return processed;
    }

    public static async getModUpdatedAtFromApi(mods: IMod[]): Promise<IMod[]> {
        if (mods.length === 0) { return []; }

        const items = await SteamApi.getPublishedItems(...mods.map(mod => mod.id));

        for (const [index, mod] of mods.entries()) {
            mod.updatedAt = items[index].time_updated;
        }

        return mods;
    }
}
