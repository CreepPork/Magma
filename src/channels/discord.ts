import INotificationChannel from '../interfaces/iNotificationChannel';
import IMod from '../interfaces/iMod';

import axios, { AxiosResponse } from 'axios';
import IDiscordWebhookPayload from '../interfaces/iDiscordWebhookPayload';
import ISteamPublishedFile from '../interfaces/iSteamPublishedFile';
import Time from '../time';
import Filesystem from '../filesystem';

export default class Discord implements INotificationChannel {
    private webhookUrl: string;

    constructor(webhookUrl: string) {
        this.webhookUrl = webhookUrl;
    }

    public generateEmbed(mod: IMod, workshop: ISteamPublishedFile, serverPath: string): IDiscordWebhookPayload {
        return {
            embeds: [{
                title: `New update for ${mod.name}!`,
                description: '**A new update has been released and requires your action!**',
                url: `https://steamcommunity.com/workshop/filedetails/?id=${mod.id}`,
                color: 15588927, // Yellow
                timestamp: new Date(),
                footer: {
                    text: `Magma v${require('../../package.json').version}`,
                },
                image: {
                    url: workshop.preview_url,
                },
                fields: [
                    {
                        name: 'Server Path',
                        value: serverPath,
                    },
                    {
                        name: 'Last Modified',
                        value: mod.updatedAt ? Time.epochToDate(mod.updatedAt).toUTCString() : 'Not Installed',
                    },
                    {
                        name: 'Updated on Workshop',
                        value: Time.epochToDate(workshop.time_updated).toUTCString(),
                    },
                    {
                        name: 'Mod Size on Workshop',
                        value: Filesystem.fileSizeForHumans(workshop.file_size),
                    }
                ],
            }],
        }
    }

    public generateConfirmationMessage(mod: IMod, serverPath: string): IDiscordWebhookPayload {
        return {
            embeds: [{
                title: `${mod.name} is now up-to-date!`,
                description: 'The mod has been updated and no further action is required.',
                color: 3779158, // Green
                timestamp: new Date(),
                footer: {
                    text: `Magma v${require('../../package.json').version}`,
                },
                fields: [{
                    name: 'Server Path',
                    value: serverPath,
                }],
            }],
        }
    }

    public async send(embed: IDiscordWebhookPayload): Promise<AxiosResponse> {
        return await axios.post(this.webhookUrl, embed);
    }
}
