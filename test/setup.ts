export default function setupCommand(): void {
    /**
     * Node checks for argument type that is provided for this function.
     *
     * This is called in `Plugin.warn (node_modules/@oclif/config/lib/plugin.js:185:17)`.
     *
     * Because Jest creates a different type for the Error class,
     * Node's type check fails due to `instanceOf` returning false.
     *
     * We mock this emitWarning to prevent it throwing an error and breaking our tests.
     * See issue: https://github.com/facebook/jest/issues/2549#issuecomment-533782340.
     */
    global.process.emitWarning = jest.fn();
}
