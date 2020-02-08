import IConfigEntry from '../interfaces/iConfigEntry';

import * as os from 'os';

const configEntries: IConfigEntry[] = [
    { config: 'credentials', displayName: 'Steam credentials' },
    { config: 'linuxGsm', displayName: 'LinuxGSM instance configuration file', condition: () => os.platform() === 'linux' },
    { config: 'serverPath', displayName: 'Server path' },
    { config: 'steamCmdPath', displayName: 'SteamCMD path' },
    { config: 'webhookUrl', displayName: 'Webhook URL' },
];

export default configEntries;
