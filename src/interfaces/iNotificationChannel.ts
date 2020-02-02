import IMod from './iMod';

import { AxiosResponse } from 'axios';
import ISteamPublishedFile from './iSteamPublishedFile';

export default interface INotificationChannel {
    generateEmbed(mod: IMod, workshop: ISteamPublishedFile, serverPath: string): object;
    send(embed: object): Promise<AxiosResponse>;
}
