import * as path from 'path';
import Config from './config';
import CServer from './constants/server';
import { EModType } from './enums/eModType';
import IMod from './interfaces/iMod';
import ISteamMod from './interfaces/iSteamMod';
import SteamApi from './steam/steamApi';
import Time from './time';



export default class Mod {
    public static async generateModsFromApi(mods: { id: number, steamId: number, type: EModType }[]): Promise<IMod[]> {
        if (mods.length === 0) { return []; }

        const processed: IMod[] = [];

        const items = await SteamApi.getPublishedItems(mods.map(mod => mod.steamId));

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

    public static generateModId(): number {
        Config.ensureIsInitialized();
        const lastId = Config.get('lastId');

        const newId = lastId === undefined ? 0 : lastId + 1;
        Config.set('lastId', newId);

        return newId;
    }

    public static getLocalModUpdatedAt(mods: IMod[]): IMod[] {
        if (mods.length === 0) { return []; }

        for (const mod of mods) {
            mod.updatedAt = Time.toEpoch(new Date());
        }

        return mods;
    }

    public static async getModUpdatedAtFromApi(mods: ISteamMod[]): Promise<ISteamMod[]> {
        if (mods.length === 0) { return []; }

        const items = await SteamApi.getPublishedItems(mods.map(mod => mod.steamId));

        for (const [index, mod] of mods.entries()) {
            mod.updatedAt = items[index].time_updated;
        }

        return mods;
    }

    public static filterLocalMods(mods: IMod[]): IMod[] {
        return mods.filter(mod => mod.isLocal === true);
    }

    public static filterSteamMods(mods: IMod[]): ISteamMod[] {
        return mods.filter(mod => mod.steamId !== undefined && mod.isLocal === false) as ISteamMod[];
    }

    public static getInstalledPath(mod: IMod): string {
        if (mod.isLocal) {
            const dir = mod.type === EModType.all
                ? 'mods'
                : (mod.type === EModType.server ? 'servermods' : 'clientmods');

            return path.join(Config.get('serverPath'), dir, `@${mod.name}`);
        } else {
            return path.join(Config.get('serverPath'), `steamapps/workshop/content/${CServer.id}/${mod.steamId}`);
        }
    }
}
