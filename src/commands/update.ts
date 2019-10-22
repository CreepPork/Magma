import Command from '@oclif/command';
import Config from '../config';
import Mod from '../mod';
import Processor from '../processor';
import SteamCmd from '../steam/steamCmd';

export default class ActivateCommand extends Command {
    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        // Filter for only installed mods
        const configMods = Config.get('mods');
        const mods = configMods.filter(mod => mod.updatedAt !== undefined);

        if (mods.length === 0) { return; }

        // Check for those mods that need updates from SteamAPI
        const apiMods = await Mod.getModUpdatedAtFromApi(mods);

        const queuedMods = [];

        for (const [index, mod] of mods.entries()) {
            if (apiMods[index].updatedAt !== mod.updatedAt) {
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
