import Command from '@oclif/command';
import SteamCmd from '../steam/steamCmd';

export default class TestCommand extends Command {
    public async run(): Promise<void> {
        console.log(
            await SteamCmd.download(713709341),
        );
    }
}
