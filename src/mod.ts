import { EModType } from './enums/eModType';
import IMod from './interfaces/iMod';

export default class Mod {
    public static async getModFromApi(id: number, type: EModType): Promise<IMod> {
        return (await this.getModsFromApi({ id, type }))[0];
    }

    public static async getModsFromApi(...mods: [{ id: number, type: EModType }]): Promise<IMod[]> {
        return [];
    }
}
