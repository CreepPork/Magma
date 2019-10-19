export default class NotInitializedError extends Error {
    constructor() {
        super('Magma is not initialized. Run `magma init` to initialize your project.');
    }
}
