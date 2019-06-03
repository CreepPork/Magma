import { Command as OclifCommand } from '@oclif/command';
import Settings from './settings';

import chalk from 'chalk';

export default abstract class Command extends OclifCommand {
    /**
     * If this method is executed then the command will exit if a project hasn't been initialized.
     */
    protected checkIfInitialized() {
        if (! Settings.fileExists()) {
            this.error(`The project is not initialized. Run '${chalk.magenta('magma initialize')}'.`, {
                exit: 1,
            });
        }
    }
}
