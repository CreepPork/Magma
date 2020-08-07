import { Command as OclifCommand } from '@oclif/command';
import * as Sentry from '@sentry/node';
import Config from './config';
import NotInitializedError from './errors/notInitializedError';
import OutdatedConfigurationFileError from './errors/outdatedConfigurationFileError';

export default abstract class Command extends OclifCommand {
    public static useSentry = true;

    private static ignoredExceptions = [
        typeof OutdatedConfigurationFileError,
        typeof NotInitializedError
    ];

    protected async catch(error: Error): Promise<any> {
        this.initSentry();

        if (Command.ignoredExceptions.includes(typeof error)) {
            return super.catch(error);
        }

        Sentry.captureException(error, scope => {
            try {
                const config = Config.exists() ? Config.getAll() : undefined;

                if (config) {
                    // Before scrubbing, we'll use the Steam user as a unique identifier
                    scope.setUser({
                        username: config.credentials.username
                    });

                    // Scrub sensitive details
                    config.credentials = undefined as any;
                    config.key = undefined as any;
                    config.webhookUrl = undefined;

                    scope.setContext('config', config);

                    /**
                     * Sentry requires context elements to be in an object.
                     *
                     * If wrapping an array of objects into an array, it just returns [Object].
                     * To prevent this, we are putting everything in one object.
                     *
                     * To improve readability, we are are indexing object keys with their key.
                     */
                    const mods = {} as any;
                    for (const [i, mod] of config.mods.entries()) {
                        for (const [key, value] of Object.entries(mod)) {
                            // Config might have an array and to prevent [Array], we append it to the object too.
                            if (Array.isArray(value)) {
                                for (const [j, arrayKey] of value.entries()) {
                                    mods[`${i}_${key}_${j}`] = arrayKey;
                                }
                            } else {
                                mods[`${i}_${key}`] = value;
                            }
                        }
                    }

                    scope.setContext('mods', mods);

                    scope.setTag('config-version', config.version.toString());
                }

                const json = require('../package.json');

                if (json) {
                    scope.setTag('config-latest', json.magma.latestConfigVersion);
                    scope.setTag('version', json.version);
                }

            } catch (error) {
                console.error('Failed to generate Sentry report:');
                console.error(error);
            }

            return scope;
        });

        // Send the exception right now, otherwise it won't be sent
        try {
            await Sentry.flush();
        } catch (error) {
            console.warn('Sentry is not initalized, please notify the developer.');
        }

        return super.catch(error);
    }

    private initSentry(): void {
        if (Command.useSentry) {
            Sentry.init({
                dsn: 'https://a40f7820b71947b4843450685d74be7a@o288394.ingest.sentry.io/1796112',
            });
        }
    }
}
