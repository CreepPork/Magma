import { flags } from '@oclif/command';

export const nonInteractive = flags.boolean({
    char: 'n',
    default: false,
    description: 'Do not prompt for any input.',
});
