/// <reference path="../../typings/node/node.d.ts"/>

'use strict';

import FileSystemProviderInterface = require('./FilesystemProviderInterface');
import util = require('util');

class PrepackagedFilesystemProvider implements FileSystemProviderInterface {

    constructor(private _blob: PrepackagedFilesystemProvider.BlobInterface)
    {}

    readBinaryFileSync(name: string): Buffer {
        var resolved = this._resolve(name);

        if (typeof(resolved) === 'undefined')
            throw new Error(util.format('%s not part of file bundle', name));

        if (!Buffer.isBuffer(resolved))
             throw new Error(util.format('%s is a directory, not a file', name));

        return resolved;
    }

    readTextFileSync(name: string): string {
        var buffer = this.readBinaryFileSync(name);

        return buffer.toString();
    }

    private _resolve(path: string): any {
        var atoms: Array<string> = path.split('/'),
            natoms = atoms.length,
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
