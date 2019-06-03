import { ISteamPublishedFile } from './interfaces/steamPublishedFile';
import { IMod } from './popularMods';
import Settings from './settings';

import axios, { AxiosResponse } from 'axios';
import * as _ from 'lodash';
import * as qs from 'qs';

export default class Mod {
    public static async generateModFromId(appId: number, itemId: number): Promise<IMod> {
        // Find if item already exists in mod list in magma.json
        const mods = _.find(Settings.get('mods'), { itemId });

        if (mods) {
            return mods;
        }

        // If not gen a new mod and append to magma.json
        const response: AxiosResponse<ISteamPublishedFile> = await axios.post(
            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
            qs.stringify({
                'itemcount': 1,
                'publishedfileids[0]': itemId,
            }), {
                headers: {
                    'content-type': 'application/x-www-urlencoded',
                },
            },
        );

        const data = response.data;

        return {
            gameId: appId,
            itemId,
            name: data.response.publishedfiledetails[0].title,
        } as IMod;
    }
}
