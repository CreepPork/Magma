import Command from '@oclif/command';
import Config from '../config';
import Processor from '../processor';
import SteamCmd from '../steam/steamCmd';
import SteamApi from '../steam/steamApi';
import ISteamMod from '../interfaces/iSteamMod';
import Mod from '../mod';

export default class ActivateCommand extends Command {
    public static description = 'Updates currently downloaded mods from Steam Workshop.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        // Filter for only installed mods
        const configMods = Config.get('mods');
        const mods: ISteamMod[] = Mod.filterSteamMods(configMods).filter(mod => mod.updatedAt !== undefined);

        if (mods.length === 0) {
            console.log('No installed mods.');

            return;
        }

        // Check for those mods that need updates from SteamAPI
        const apiMods = await SteamApi.getPublishedItems(mods.map(mod => mod.steamId));

        const queuedMods = [];

        for (const [index, mod] of mods.entries()) {
            const apiMod = apiMods[index];

            if (apiMod.time_updated !== mod.updatedAt) {
                mod.updatedAt = apiMod.time_updated;

                queuedMods.push(mod);
            }
        }

        if (queuedMods.length === 0) {
            console.log('All mods are up-to-date.');

            return;
        } else {
            console.log(`Found updates for ${queuedMods.map(mod => mod.name).join(', ')}`);
        }

        // Run SteamCmd
        await SteamCmd.download(queuedMods.map(mod => mod.steamId));

        // Update keys
        const updatedMods = Processor.updateKeys(queuedMods);

        // Update magma.json
        for (const mod of updatedMods) {
            const index = configMods.findIndex(configMod => configMod.id === mod.id);

            configMods[index] = mod;
        }

        console.log(`Updated ${updatedMods.map(mod => mod.name).join(', ')}`);

        Config.set('mods', configMods);
    }
}
