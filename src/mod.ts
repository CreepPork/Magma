import { ISteamPublishedFile } from './interfaces/steamPublishedFile';
import { IMod } from './popularMods';
import Settings from './settings';
import Time from './time';

import axios, { AxiosResponse } from 'axios';
import * as _ from 'lodash';
import * as qs from 'qs';

export default class Mod {
    public static async generateModFromId(appId: number, itemId: number): Promise<IMod> {
        const mods = Settings.get('mods');

        // Find if item already exists in mod list in magma.json
        const existingMod = _.find(mods, { itemId });

        if (existingMod) {
            return existingMod;
        }

        // If not gen a new mod and append to magma.json
        const response: AxiosResponse<ISteamPublishedFile> = await axios.post(
            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
            qs.stringify({
                'itemcount': 1,
                'publishedfileids[0]': itemId,
            }), {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            },
        );

        const data = response.data;

        const mod = {
            gameId: appId,
            itemId,
            name: data.response.publishedfiledetails[0].title,
            updatedAt: data.response.publishedfiledetails[0].time_updated,
        } as IMod;

        mods.push(mod);
        Settings.write('mods', mods);

        return mod;
    }
}
