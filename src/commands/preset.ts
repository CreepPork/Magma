import Command from '@oclif/command';
import Config from '../config';

export default class PresetCommand extends Command {
    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        //
    }
}
