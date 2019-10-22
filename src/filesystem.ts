import * as fs from 'fs-extra';
import * as klaw from 'klaw-sync';
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

    public static getFilename(filepath: string): string {
        return path.parse(filepath).base;
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

    public static findFilesWithExtension(filepath: string, extension: string): string[] {
        return this.getAllFilesRecursively(filepath).filter(file => file.includes(extension));
    }

    public static getAllDirectoriesRecursively(filepath: string): string[] {
        return klaw(filepath, { nofile: true }).map(item => item.path);
    }

    public static getAllFilesRecursively(filepath: string): string[] {
        return klaw(filepath, { nodir: true }).map(item => item.path);
    }

    public static renameContentsToLowercase(filepath: string): void {
        const dirs = this.getAllDirectoriesRecursively(filepath);

        for (const [i, dir] of dirs.entries()) {
            if (fs.existsSync(dir)) {
                fs.renameSync(dir, path.join(dir, '..', this.getFilename(dir).toLowerCase()));
            } else {
                const newDirs = this.getAllDirectoriesRecursively(filepath);
                const updatedDir = newDirs[i];

                fs.renameSync(updatedDir, path.join(updatedDir, '..', this.getFilename(updatedDir).toLowerCase()));
            }
        }

        const files = this.getAllFilesRecursively(filepath);

        for (const file of files) {
            fs.renameSync(file, path.join(file, '..', this.getFilename(file).toLowerCase()));
        }
    }
}
