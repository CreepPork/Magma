import axios, { AxiosResponse } from 'axios';
import ISteamPublishedFile from '../interfaces/iSteamPublishedFile';

import * as qs from 'qs';
import ISteamRemoteStorage from '../interfaces/iSteamRemoteStorage';

export default class SteamApi {
    public static async getPublishedItem(id: number): Promise<ISteamPublishedFile> {
        return (await this.getPublishedItems(id))[0];
    }

    public static async getPublishedItems(...ids: number[]): Promise<ISteamPublishedFile[]> {
        const data: {[key: string]: number} = {};

        for (const [index, id] of ids.entries()) {
            data[`publishedfileids[${index}]`] = id;
        }

        const response: AxiosResponse<ISteamRemoteStorage> = await axios.post(
            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
            qs.stringify({...{
                itemcount: ids.length,
            }, ...data}), {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            },
        );

        for (const item of response.data.response.publishedfiledetails) {
            switch (item.result) {
                // Status OK
                case 1:
                    break;
                case 9:
                    throw new Error(`Item with the given id of ${item.publishedfileid} does not exist.`);
                default:
                    throw new Error(`Something went wrong when recieving the file data for ${item.publishedfileid}.`);
            }
        }

        return response.data.response.publishedfiledetails;
    }
}
