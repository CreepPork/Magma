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
            const stats = fs.lstatSync(filepath);

            return stats.isSymbolicLink()
                ? true
                : stats.isDirectory();
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

        // Sort the directories by their amount of subdirectories (more subdirs the closer it gets to the first element)
        dirs.sort((a, b) =>
            a.split(path.sep).length > b.split(path.sep).length
                ? -1
                : (a.split(path.sep).length === b.split(path.sep).length ? 0 : 1),
        );

        for (const dir of dirs) {
            fs.renameSync(dir, path.join(dir, '..', this.getFilename(dir).toLowerCase()));
        }

        // Rename files individually to prevent file does not exist errors
        const files = this.getAllFilesRecursively(filepath);
        for (const file of files) {
            fs.renameSync(file, path.join(file, '..', this.getFilename(file).toLowerCase()));
        }
    }

    public static fileSizeForHumans(bytes: number, decimals = 2): string {
        if (bytes === 0) {
            return '0 Bytes';
        }

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
