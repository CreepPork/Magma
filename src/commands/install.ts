import Command from '../command';
import Settings from '../settings';
import Download from './download';

export default class Install extends Command {
    public static description = 'Installs and updates all mods that are present in your configuration file.';

    public static aliases = [
        'update',
    ];

    public async run() {
        this.checkIfInitialized();

        const mods = Settings.get('mods');

        Download.run(mods.map(mod => mod.itemId.toString()));
    }
}
