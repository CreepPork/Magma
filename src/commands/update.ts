import Command from '@oclif/command';
import Config from '../config';
import Processor from '../processor';
import SteamCmd from '../steam/steamCmd';
import SteamApi from '../steam/steamApi';

export default class ActivateCommand extends Command {
    public static description = 'Updates currently downloaded mods from Steam Workshop.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        // Filter for only installed mods
        const configMods = Config.get('mods');
        const mods = configMods.filter(mod => mod.updatedAt !== undefined);

        if (mods.length === 0) { return; }

        // Check for those mods that need updates from SteamAPI
        const apiMods = await SteamApi.getPublishedItems(...mods.map(mod => mod.id));

        const queuedMods = [];

        for (const [index, mod] of mods.entries()) {
            const apiMod = apiMods[index];

            if (apiMod.time_updated !== mod.updatedAt) {
                mod.updatedAt = apiMod.time_updated;

                queuedMods.push(mod);
            }
        }

        if (queuedMods.length === 0) { return; }

        // Run SteamCmd
        await SteamCmd.download(...queuedMods.map(mod => mod.id));

        // Update keys
        const updatedMods = Processor.updateKeys(queuedMods);

        // Update magma.json
        for (const mod of updatedMods) {
            const index = configMods.findIndex(configMod => configMod.id === mod.id);

            configMods[index] = mod;
        }

        Config.set('mods', configMods);
    }
}
