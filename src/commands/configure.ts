import * as _ from 'lodash';

import ora = require('ora');

import Command from '@oclif/command';

import * as setFlag from '../flags';

import Config from '../config';
import Insurer from '../insurer';
import IConfig from '../interfaces/iConfig';
import IConfigEntry from '../interfaces/iConfigEntry';
import Encrypter from '../encrypter';
import ConfigEntries from '../constants/configEntries';

export default class ConfigureCommand extends Command {
    public static description = 'Allows to modify the existing configuration file. In interactive mode all flags will be ignored (except Steam Guard).';
    public static aliases = ['config'];
    public static examples = [
        'magma configure',
        'magma configure --steamCmd "/var/steamcmd"',
        'magma configure -n -u UserName',
    ];
    public static flags = {
        linuxGsmInstanceConfig: setFlag.linuxGsmInstanceConfig,
        nonInteractive: setFlag.nonInteractive,
        password: setFlag.password,
        server: setFlag.server,
        steamCmd: setFlag.steamCmd,
        steamGuard: setFlag.steamGuard,
        username: setFlag.username,
        webhookUrl: setFlag.webhookUrl,
    };

    public async init(): Promise<void> {
        Config.ensureIsInitialized();
    }

    private insurer?: Insurer;
    private spinner?: ora.Ora;
    private steamCmdPath?: string;
    private steamGuard?: string;

    public async run(): Promise<void> {
        const { flags } = this.parse(ConfigureCommand);

        this.spinner = ora({ discardStdin: true, text: 'Validating Steam credentials' });

        this.insurer = new Insurer(flags.nonInteractive, this.spinner);

        this.steamGuard = flags.steamGuard;

        // If any other flags were passed (--nonInteractive is always present)
        if (Object.keys(flags).length > 1) {
            // See Prompt.forConfigEntries() comment
            if (flags.steamCmd) {
                this.steamCmdPath = await this.validateEntry(this.convertFlagToEntry('steamCmdPath') as any, flags.steamCmd);

                Config.set('steamCmdPath', this.steamCmdPath as string);
            } else {
                for (const key of Object.keys(flags)) {
                    if (key === 'steamCmd' || key === 'steamGuard' || key === 'nonInteractive') { continue; }

                    let value;

                    switch (key) {
                        case 'linuxGsmInstanceConfig':
                            value = await this.validateEntry(
                                this.convertFlagToEntry('linuxGsm'), flags.linuxGsmInstanceConfig
                            );
                            break;

                        case 'password':
                            if (!flags.username) { throw new Error('The --password flag requires the --username flag.'); }

                            value = await this.validateEntry(
                                this.convertFlagToEntry('credentials'), flags.username, flags.password
                            );
                            break;

                        case 'server':
                            value = await this.validateEntry(
                                this.convertFlagToEntry('serverPath'), flags.server
                            );
                            break;

                        case 'username':
                            if (!flags.password) { throw new Error('The --username flag requires the --password flag.'); }
                            break;

                        case 'webhookUrl':
                            value = await this.validateEntry(
                                this.convertFlagToEntry('webhookUrl'), flags.webhookUrl
                            );
                            break;

                        default:
                            throw new Error(`Encountered an undefined flag: ${key}`);
                    }

                    Config.set((key === 'password' || key === 'username') ? 'credentials' as any : key, value);
                }
            }
        } else {
            if (flags.nonInteractive) {
                throw new Error('No flags were specified that indicate which properties should be updated.');
            }

            const configEntries = await this.insurer.prompt.forConfigEntries();

            for (const entry of configEntries) {
                const data = await this.validateEntry(entry, []);

                Config.set(entry.config, data);
            }
        }
    }

    /**
     * This could return **undefined**! But if used with safe, existant keys that are defined in the ConfigEntry constants then it should be fine.
     */
    private convertFlagToEntry(type: keyof IConfig): IConfigEntry {
        return ConfigEntries.find(e => e.config === type) as IConfigEntry;
    }

    private async validateEntry<T extends IConfigEntry, K extends IConfig[T['config']]>(entry: T, ...values: any): Promise<K | never> {
        if (!this.insurer) { throw new Error('Something went wrong, the insurer class is undefined.'); }

        let output: K | undefined;

        switch (entry.config) {
            case 'credentials':
                let credentials = await this.insurer.ensureValidLogin(...values);

                this.spinner?.start();

                while (await this.insurer.validate.credentials(
                    credentials, Config.get('key'), this.steamCmdPath ?? Config.get('steamCmdPath'), this.steamGuard) === false) {
                    this.spinner?.fail('Failed to login');

                    credentials = await this.insurer.prompt.forCredentials();

                    this.spinner?.start();
                }

                this.spinner?.succeed('Logged in');

                credentials.password = new Encrypter(Config.get('key')).encrypt(credentials.password);

                output = credentials as K;

                break;

            case 'linuxGsm':
                output = await this.insurer.ensureValidLinuxGsm(...values) as K;
                break;

            case 'serverPath':
                output = await this.insurer.ensureValidServer(...values) as K;
                break;

            case 'steamCmdPath':
                output = await this.insurer.ensureValidSteamCmd(...values) as K;
                this.steamCmdPath = output as string;

                break;

            case 'webhookUrl':
                output = await this.insurer.ensureValidWebhookUrl(...values) as K;
                break;

            default:
                throw new Error('Property is not supported.');
        }

        return output;
    }
}
