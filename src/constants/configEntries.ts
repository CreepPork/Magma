import * as os from 'os';
import IConfigEntry from '../interfaces/iConfigEntry';

const configEntries: IConfigEntry[] = [
    { config: 'credentials', displayName: 'Steam credentials' },
    { config: 'linuxGsm', displayName: 'LinuxGSM instance configuration file', condition: () => os.platform() === 'linux' },
    { config: 'batchScript', displayName: 'Batch file (*.bat) where your mods are listed in', condition: () => os.platform() === 'win32' },
    { config: 'serverPath', displayName: 'Server path' },
    { config: 'steamCmdPath', displayName: 'SteamCMD path' },
    { config: 'webhookUrl', displayName: 'Webhook URL' },
];

export default configEntries;
