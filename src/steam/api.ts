import { ISteamPublishedFile } from '../interfaces/steamPublishedFile';

import * as qs from 'qs';

import axios, { AxiosResponse } from 'axios';

export default class SteamApi {
    public static async getPublishedItemDetails(itemId: number): Promise<ISteamPublishedFile> {
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

        return response.data;
    }
}
