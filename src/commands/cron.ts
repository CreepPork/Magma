import * as _ from 'lodash';

import Command from '@oclif/command';

import Config from '../config';
import Discord from '../channels/discord';
import SteamApi from '../steam/steamApi';

export default class CronCommand extends Command {
    public static description = 'A command designed to be run in a time-based job scheduler to notify on social platforms for mod updates.';
    public static examples = [
        'magma cron',
    ];

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const config = Config.getAll();
        const { webhookUrl, mods, serverPath } = config;
        let { cronMessages } = config;

        if (!webhookUrl) {
            this.error('A webhook URL is not given in the configuration file.');
        }

        if (mods.length === 0) {
            this.warn('No mods are present in the configuration file.');
            this.exit(0);
        }

        const apiReturn = await SteamApi.getPublishedItems(...mods.map(mod => mod.id));

        let updatesRequiredFor = apiReturn.filter(
            workshop => workshop.time_updated !== (mods.find(mod => `${mod.id}` === workshop.publishedfileid))?.updatedAt
        );

        const modsWhichHaveBeenPosted = apiReturn.filter(
            workshop => cronMessages.includes(parseInt(workshop.publishedfileid, 10))
        );

        const discord = new Discord(webhookUrl);

        // Check if posted mods have been updated
        for (const workshop of modsWhichHaveBeenPosted) {
            const mod = mods.find(m => m.id === parseInt(workshop.publishedfileid, 10));

            if (!mod) { continue; }

            console.log(mod.updatedAt, workshop.time_updated);

            if (mod.updatedAt === workshop.time_updated) {
                cronMessages = _.remove(cronMessages, mod.id);

                // Post a confirmation message that the mod has been updated
                const embed = discord.generateConfirmationMessage(mod, serverPath);

                await discord.send(embed);
            } else {
                // Don't post the message again
                updatesRequiredFor = _.remove(updatesRequiredFor, workshop);
            }
        }

        for (const workshop of updatesRequiredFor) {
            const mod = mods.find(m => `${m.id}` === workshop.publishedfileid);

            if (mod) {
                cronMessages.push(mod.id);

                const embed = discord.generateEmbed(mod, workshop, serverPath);

                await discord.send(embed);
            }
        }

        Config.set('cronMessages', cronMessages);
    }
}
