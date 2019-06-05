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

        const result = response.data.response.publishedfiledetails[0].result;
        if (result !== 1) {
            if (result === 9) {
                throw new Error(`Item ${itemId} does not exist`);
            } else {
                throw new Error(`Something went wrong while trying to fetch data for item ${itemId}`);
            }
        }

        return response.data;
    }
}
