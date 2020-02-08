import { flags } from '@oclif/command';

export const nonInteractive = flags.boolean({
    char: 'n',
    default: false,
    description: 'Do not prompt for any input.',
});

export const linuxGsmInstanceConfig = flags.string({
    char: 'l',
    description: 'Absolute path to the LinuxGSM instance configuration file (where it handles mods/servermods) (only supported on Linux)',
});

export const password = flags.string({
    char: 'p',
    description: 'Steam user password.',
});

export const server = flags.string({
    char: 's',
    description: 'Absolute path to the directory where the server is (where the server executable is).',
});

export const steamCmd = flags.string({
    char: 'c',
    description: 'Absolute path to the SteamCMD executable (including the file itself).',
});

export const steamGuard = flags.string({
    char: 'g',
    description: 'Steam Guard code to use when authenticating.'
});

export const username = flags.string({
    char: 'u',
    description: 'Steam username.',
});

export const webhookUrl = flags.string({
    char: 'w',
    description: 'Webhook URL to which the magma cron command will respond to.',
});
