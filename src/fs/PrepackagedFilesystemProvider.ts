import util = require('util');
import AbstractFileSystemProvider = require('./AbstractFileSystemProvider');
import FilesystemProviderInterface = require('./FilesystemProviderInterface');

class PrepackagedFilesystemProvider extends AbstractFileSystemProvider
    implements FilesystemProviderInterface
{
    constructor(private _blob: PrepackagedFilesystemProvider.BlobInterface) {
        super();
        this._cwd = '/';
    }

    readBinaryFileSync(name: string): Buffer {
        name = this._resolvePath(name);

        var content = this._lookup(name);

        if (typeof(content) === 'undefined')
            throw new Error(util.format('%s not part of file bundle', name));

        if (!Buffer.isBuffer(content))
             throw new Error(util.format('%s is a directory, not a file', name));

        return content;
    }

    readTextFileSync(name: string): string {
        var buffer = this.readBinaryFileSync(name);

        return buffer.toString();
    }

    readDirSync(name: string): Array<string> {
        name = this._resolvePath(name);

        var content = this._lookup(name);

        if (typeof(content) === 'undefined')
            throw new Error(util.format('%s not part of file bundle', name));

        if (typeof(content) === 'string' || Buffer.isBuffer(content))
            throw new Error(util.format('%s is a file, not a directory', name));


        return Object.keys(content);
    }

    getTypeSync(name: string): FilesystemProviderInterface.FileType {
        name = this._resolvePath(name);

        var content = this._lookup(name);

        if (typeof(content) === 'undefined')
             throw new Error(util.format('%s not part of file bundle', name));

        if (Buffer.isBuffer(content)) {
            return FilesystemProviderInterface.FileType.FILE;
        } else {
            return FilesystemProviderInterface.FileType.DIRECTORY;
        }
    }

    private _lookup(path: string): any {
        var atoms: Array<string> = path.split('/');

        var natoms = atoms.length,
            i: number,
            scope = this._blob;

        var name = atoms[natoms - 1];

        for (i = 0; i < natoms - 1; i++) {
            if (atoms[i] === '') {
                continue;
            } else if (scope.hasOwnProperty(atoms[i])) {
                scope = scope[atoms[i]];
            } else {
                return undefined;
            }
        }

        if (name && typeof(scope[name]) === 'string')
            scope[name] = new Buffer(scope[name], 'base64');

        return name ? scope[name] : scope;
    }

}

module PrepackagedFilesystemProvider {

    export interface BlobInterface {
        [index: string]: any
    }

}

export = PrepackagedFilesystemProvider;
