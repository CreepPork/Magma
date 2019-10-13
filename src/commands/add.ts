import Command from '@oclif/command';
import Helpers from '../helpers';

export default class Add extends Command {
    public async init(): Promise<void> {
        Helpers.ensureIsInitialized();
    }

    public async run(): Promise<void> {
        //
    }
}
