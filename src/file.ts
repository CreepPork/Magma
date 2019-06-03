import * as fs from 'fs-extra';
import * as path from 'path';

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

    public static getFilenameNoExt(filepath: string): string {
        return path.parse(filepath).name;
    }

    public static directoryContains(dir: string, search: string): boolean {
        return fs.readdirSync(dir).map(el => path.join(dir, el)).filter(this.isFile).some(el => el.includes(search));
    }
}
