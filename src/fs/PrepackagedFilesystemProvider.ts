/// <reference path="../../typings/node/node.d.ts"/>

'use strict';

import util = require('util');
import AbstractFileSystemProvider = require('./AbstractFileSystemProvider');
import FileSystemProviderInterface = require('./FilesystemProviderInterface');

class PrepackagedFilesystemProvider extends AbstractFileSystemProvider
    implements FileSystemProviderInterface
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

    private _lookup(path: string): any {
        var atoms: Array<string> = path.split('/');

        if (atoms.length !== 0 && atoms[0] === '') atoms.shift();
        
        var natoms = atoms.length,
            i: number,
            scope = this._blob;

        if (natoms === 0) {
            return undefined;
        }

        var name = atoms[natoms - 1];

        for (i = 0; i < natoms - 1; i++) {
            if (scope.hasOwnProperty(atoms[i])) {
                scope = scope[atoms[i]];
            } else {
                return undefined;
            }
        }

        if (typeof(scope[name]) === 'string')
            scope[name] = new Buffer(scope[name], 'base64');
        
        return scope[name];
    }

}

module PrepackagedFilesystemProvider {

    export interface BlobInterface {
        [index: string]: any
    }

}

export = PrepackagedFilesystemProvider;
