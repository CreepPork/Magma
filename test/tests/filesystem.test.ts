import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import Filesystem from '../../src/filesystem';

describe('Filesystem.isFile()', () => {
    test('Correctly identifies a file as a file', () => {
        const filepath = path.join(os.tmpdir(), 'exampleFile.txt');

        fs.writeFileSync(filepath, 'Some random data.');

        expect(Filesystem.isFile(filepath)).toBe(true);

        if (fs.existsSync(filepath)) {
            fs.removeSync(filepath);
        }
    });

    test('If file does not exist then it returns false', () => {
        expect(Filesystem.isFile(path.join('some/random/path'))).toBe(false);
    });
});

describe('Filesystem.isDirectory()', () => {
    test('Correctly identifies a directory as a directory', () => {
        expect(Filesystem.isDirectory(os.tmpdir())).toBe(true);
    });

    test('If directory does not exist it returns false', () => {
        expect(Filesystem.isDirectory(path.join('some/random/dir'))).toBe(false);
    });
});

describe('Filesystem.getFilenameNoExt()', () => {
    test('Returns everything correctly', () => {
        const filepath = path.join(os.tmpdir(), 'exampleText.txt');

        fs.writeFileSync(filepath, 'Some random data.');

        expect(Filesystem.getFilenameNoExt(filepath)).toBe('exampleText');

        if (fs.existsSync(filepath)) {
            fs.removeSync(filepath);
        }
    });
});

describe('Filesystem.directoryContains()', () => {
    test('Returns correct data', () => {
        const filepath = path.join(os.tmpdir(), 'exampleTesty.txt');

        fs.writeFileSync(filepath, 'Some random data.');

        expect(Filesystem.directoryContains(os.tmpdir(), 'exampleTesty.txt')).toBe(true);

        if (fs.existsSync(filepath)) {
            fs.removeSync(filepath);
        }
    });
});
