import * as _ from 'lodash';

import Command, { flags as flag } from '@oclif/command';

import Config from '../config';
import Discord from '../channels/discord';
import SteamApi from '../steam/steamApi';

export default class CronCommand extends Command {
    public static description = 'A command designed to be run in a time-based job scheduler to notify on social platforms for mod updates.';
    public static examples = [
        'magma cron',
    ];
    public static flags = {
        test: flag.boolean({
            char: 't',
            default: false,
            description: 'Enabling will send a simple test message to your specified webhook.'
        }),
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const { flags } = this.parse(CronCommand);

        const config = Config.getAll();
        const { webhookUrl, mods, serverPath } = config;
        let { cronMessages } = config;

        if (!webhookUrl) {
            this.error('A webhook URL is not given in the configuration file.');
        }

        if (mods.length === 0) {
            console.log('No mods are present in the configuration file.');

            return;
        }

        const discord = new Discord(webhookUrl);

        if (flags.test) {
            discord.sendText('This is a test message from Magma because the `--test` flag was specified.');

            return;
        }

        const apiReturn = await SteamApi.getPublishedItems(...mods.map(mod => mod.id));

        let updatesRequiredFor = apiReturn.filter(
            workshop =>
                workshop.time_updated !== (
                    // Find the mod via id, possibly get the updatedAt property,
                    // If property doesn't exist then it means that the mod has not been installed
                    // Thus, we falsify the if statement and fake that the mod is up to date to prevent spam.
                    (mods.find(mod => `${mod.id}` === workshop.publishedfileid))?.updatedAt ?? workshop.time_updated
                )
        );

        const modsWhichHaveBeenPosted = apiReturn.filter(
            workshop => cronMessages.includes(parseInt(workshop.publishedfileid, 10))
        );

        // Check if posted mods have been updated
        for (const workshop of modsWhichHaveBeenPosted) {
            const mod = mods.find(m => m.id === parseInt(workshop.publishedfileid, 10));

            if (!mod) { continue; }

            if (mod.updatedAt === workshop.time_updated) {
                cronMessages = _.remove(cronMessages, mod.id);

                // Post a confirmation message that the mod has been updated
                const embed = discord.generateConfirmationMessage(mod, serverPath);

                await discord.sendEmbed(embed);
            } else {
                // Don't post the message again
                updatesRequiredFor = updatesRequiredFor.filter(m => m.publishedfileid !== workshop.publishedfileid);
            }
        }

        for (const workshop of updatesRequiredFor) {
            const mod = mods.find(m => `${m.id}` === workshop.publishedfileid);

            if (mod) {
                cronMessages.push(mod.id);

                const embed = discord.generateEmbed(mod, workshop, serverPath);

                await discord.sendEmbed(embed);
            }
        }

        Config.set('cronMessages', cronMessages);
    }
}
