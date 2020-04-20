export default class OutdatedConfigurationFileError extends Error {
    constructor() {
        super('Magma has a out-of-date configuration file (magma.json). To fix this error run: `magma upgrade`.');
    }
}
