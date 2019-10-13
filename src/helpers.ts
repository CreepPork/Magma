import Config from './config';

export default class Helpers {
    public static ensureIsInitialized(): never | void {
        if (! Config.exists()) {
            throw new Error('Magma is not initialized. Run `magma init` to initialize your project.');
        }
    }
}
