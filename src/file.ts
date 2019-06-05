import * as fs from 'fs-extra';
import * as klaw from 'klaw-sync';
import * as _ from 'lodash';
import * as path from 'path';

import Crypto from './crypto';

export default class File {
    public static isFile(filepath: string): boolean {
        if (fs.existsSync(filepath)) {
            return fs.lstatSync(filepath).isFile();
        }

        return false;
    }

    public static isDirectory(dir: string): boolean {
        if (fs.existsSync(dir)) {
            return fs.lstatSync(dir).isDirectory();
        }

        return false;
    }

    public static getFilename(filepath: string): string {
        return path.parse(filepath).base;
    }

    public static getFilenameNoExt(filepath: string): string {
        return path.parse(filepath).name;
    }

    public static directoryContains(dir: string, search: string): boolean {
        return fs.readdirSync(dir).map(el => path.join(dir, el)).filter(this.isFile).some(el => el.includes(search));
    }

    public static getAllFilesRecursively(dir: string): string[] {
        return klaw(dir).map(item => item.path).filter(this.isFile);
    }

    public static async getChecksumForFile(file: string): Promise<string> {
        return await Crypto.createChecksum(fs.readFileSync(file).toString());
    }

    public static async getChecksumForFiles(files: string[]): Promise<IChecksumFile[]> {
        const checksums: IChecksumFile[] = [];

        for (const file of files) {
            checksums.push({ file, filename: this.getFilename(file), checksum: await this.getChecksumForFile(file) });
        }

        return checksums;
    }

    /**
     * Returns a string array of files that are different should be updated.
     * If file is returned from the `compareDir` then it should be removed from disk.
     */
    public static async compareFiles(mainDir: string, compareDir: string): Promise<string[]> {
        let differentFiles: string[] = [];

        const mainDirChecksums = await this.getChecksumForFiles(this.getAllFilesRecursively(mainDir));
        const compareDirChecksums = await this.getChecksumForFiles(this.getAllFilesRecursively(compareDir));

        const missingFiles = mainDirChecksums.filter(
            el => !compareDirChecksums.map(check => check.filename).includes(el.filename),
        );

        missingFiles.push(...compareDirChecksums.filter(
            el => !mainDirChecksums.map(check => check.filename).includes(el.filename),
        ));

        differentFiles.push(...missingFiles.map(el => el.file));

        // Remove duplicates
        differentFiles = [...new Set(differentFiles)];

        for (const mainChecksum of mainDirChecksums) {
            const equalItem = _.find(compareDirChecksums, {
                checksum: mainChecksum.checksum,
                filename: mainChecksum.filename,
            });

            if (! equalItem && ! differentFiles.includes(mainChecksum.file)) {
                differentFiles.push(mainChecksum.file);
            }
        }

        return differentFiles;
    }

    public static findFiles(dir: string, extension: string): string[] {
        return this.getAllFilesRecursively(dir).filter(file => file.includes(extension));
    }
}

export interface IChecksumFile {
    file: string;
    filename: string;
    checksum: string;
}
