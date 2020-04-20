import { EModType } from './enums/eModType';
import IMod from './interfaces/iMod';
import SteamApi from './steam/steamApi';

export default class Mod {
    public static async generateModsFromApi(mods: { id: number, steamId: number, type: EModType }[]): Promise<IMod[]> {
        if (mods.length === 0) { return []; }

        const processed: IMod[] = [];

        const items = await SteamApi.getPublishedItems(...mods.map(mod => mod.steamId));

        for (const [index, mod] of mods.entries()) {
            const name = items[index].title;

            processed.push({
                id: mod.id,
                steamId: mod.steamId,
                isActive: true,
                isLocal: false,
                name,
                type: mod.type,
            });
        }

        return processed;
    }

    public static getLastModId(): number {
        Config.ensureIsInitialized();

        const mods = Config.get('mods');
        let id = 0;

        for (const mod of mods) {
            if (mod.id > id) {
                id = mod.id;
            }
        }

        return id;
    }

    public static generateModId(): number {
        return this.getLastModId() + 1;
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
