import * as fs from 'fs-extra';
import * as path from 'path';

export default class Filesystem {
    public static isFile(filepath: string): boolean {
        if (fs.existsSync(filepath)) {
            return fs.lstatSync(filepath).isFile();
        }

        return false;
    }

    public static isDirectory(filepath: string): boolean {
        if (fs.existsSync(filepath)) {
            return fs.lstatSync(filepath).isDirectory();
        }

        return false;
    }

    public static getFilenameNoExt(filepath: string): string {
        return path.parse(filepath).name;
    }

    public static directoryContains(filepath: string, search: string): boolean {
        return fs.readdirSync(filepath)
            .map(el => path.join(filepath, el))
            .filter(this.isFile)
            .some(el => el.includes(search));
    }
}
