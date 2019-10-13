import * as fs from 'fs-extra';
import * as path from 'path';

export default class Config {
    public static exists(): boolean {
        return fs.existsSync(this.path());
    }

    private static path(): string {
        return path.join(process.cwd(), 'magma.json');
    }
}
