import * as fs from 'fs';
import FilesystemProviderInterface from './FilesystemProviderInterface';
import AbstractFileSystemProvider from './AbstractFileSystemProvider';

class NodeFilesystemProvider extends AbstractFileSystemProvider
    implements FilesystemProviderInterface
{
    constructor() {
        super();
        this._cwd = process.cwd();
    }

    readBinaryFileSync(name: string): Buffer {
        return fs.readFileSync(this._resolvePath(name));
    }

    readTextFileSync(name: string): string {
        return this.readBinaryFileSync(name).toString('utf8');
    }

    readDirSync(name: string): Array<string> {
        return fs.readdirSync(this._resolvePath(name));
    }

    getTypeSync(name: string): FilesystemProviderInterface.FileType {
        if (fs.statSync(this._resolvePath(name)).isDirectory()) {
            return FilesystemProviderInterface.FileType.DIRECTORY;
        } else {
            return FilesystemProviderInterface.FileType.FILE;
        }
    }
}

export default NodeFilesystemProvider;
