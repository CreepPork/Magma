import Command from '@oclif/command';
import * as chalk from 'chalk';
import Config from '../config';

export default class ActivateCommand extends Command {
    public static description = 'Upgrades Magma configuration file to match the newest version.';

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        const currentVersion = Config.getCurrentVersion();
        const latestVersion = Config.getLatestVersion();

        if (currentVersion === latestVersion) {
            console.log('The configuration file is already up-to-date.');

            return;
        }

        switch (currentVersion) {
            case undefined:
                this.performUpdateToVersion2();
                break;

            case 2:
                this.performUpdateToVersion3();
                break;

            default:
                console.log('This configuration version is not supported by the auto-updater. Update the configuration file manually.');

                return;
        }

        console.log(
            `The configuration file was updated to version ${chalk.yellow(`v${Config.get('version')}`)}.\n`
            + `The latest version is ${chalk.green(`v${latestVersion}`)}.\n\n`
            + `If these numbers ${chalk.red('do not')} match, then run this utilty again.`
        );
    }

    private performUpdateToVersion2(): void {
        const config = Config.getAll();

        // Swap id with steamId, add a id and add the isLocal property
        for (const [index, mod] of config.mods.entries()) {
            mod.steamId = mod.id;
            mod.id = index;
            mod.isLocal = false;
        }

        Config.setAll(config);

        // Update config version
        Config.set('version', 2);
    }

    private performUpdateToVersion3(): void {
        const config = Config.getAll();

        // Add lastId property
        config.lastId = config.mods.length;

        Config.setAll(config);
        Config.set('version', 3);
    }
}
