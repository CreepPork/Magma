import Command from '../command';
import Settings from '../settings';
import Download from './download';

export default class Update extends Command {
    public static description = 'Updates installed mods to their latest versions.';

    public async run() {
        this.checkIfInitialized();

        const mods = Settings.get('mods');

        Download.run(mods.map(mod => mod.itemId.toString()));
    }
}
