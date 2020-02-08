import IConfigEntry from '../interfaces/iConfigEntry';

import * as os from 'os';

const configEntries: IConfigEntry[] = [
    { config: 'credentials.username' as any, displayName: 'Steam username' },
    { config: 'credentials.password' as any, displayName: 'Steam password' },
    { config: 'linuxGsm', displayName: 'LinuxGSM instance configuration file', condition: () => os.platform() === 'linux' },
    { config: 'serverPath', displayName: 'Server path' },
    { config: 'steamCmdPath', displayName: 'SteamCMD path' },
    { config: 'webhookUrl', displayName: 'Webhook URL' },
];

export default configEntries;
