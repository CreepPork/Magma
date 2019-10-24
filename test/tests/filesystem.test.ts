import * as fs from 'fs-extra';
import * as klaw from 'klaw-sync';
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

describe('Filesystem.renameContentsToLowercase()', () => {
    test('It correctly renames a directory with multiple directories and files all to lowercase', () => {
        const filepath = path.join(os.tmpdir(), 'magmaRandomFolderForTests');
        fs.mkdirsSync(filepath);

        // Make some contents
        const dir1 = path.join(filepath, 'BigFolder');
        const dir2 = path.join(filepath, 'BigFolder', 'OtherFolder');
        const dir3 = path.join(filepath, 'SomeOtherFolder');

        fs.mkdirsSync(dir1);
        fs.mkdirsSync(dir2);
        fs.mkdirsSync(dir3);

        fs.writeFileSync(path.join(filepath, 'FileOne.txt'), '');
        fs.writeFileSync(path.join(filepath, 'FileTwo.md'), '');
        fs.writeFileSync(path.join(filepath, 'FileThree.exe'), '');

        fs.writeFileSync(path.join(dir1, 'SomeFie.EXT1'), '');
        fs.writeFileSync(path.join(dir1, 'DirTwo.test'), '');

        fs.writeFileSync(path.join(dir2, 'lowercase.txt'), '');
        fs.writeFileSync(path.join(dir2, 'biggerCase.txt'), '');

        fs.writeFileSync(path.join(dir3, 'someNewFIle.txt'), '');
        fs.writeFileSync(path.join(dir3, 'randomFile.ZIP'), '');

        Filesystem.renameContentsToLowercase(filepath);

        for (const relativePath of klaw(filepath).map(item => item.path)) {
            const cutDir = path.relative(filepath, relativePath);
            expect(cutDir).toBe(cutDir.toLowerCase());
        }

        if (fs.existsSync(filepath)) {
            fs.removeSync(filepath);
        }
    });
});
