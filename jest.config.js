// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        'src/**/*.ts',
    ],

    // The directory where Jest should output its coverage files
    coverageDirectory: 'test/coverage',

    coveragePathIgnorePatterns: [
        '/node_modules/',
        'src/@types'
    ],

    // An array of file extensions your modules use
    moduleFileExtensions: [
        'ts',
        'js'
    ],

    // The test environment that will be used for testing
    testEnvironment: 'node',

    testMatch: [
        '**/test/**/*.test.ts',
    ],

    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
};
