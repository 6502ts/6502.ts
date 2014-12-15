'use strict';

import base64 = require('../tools/base64');
import FileSystemProviderInterface = require('./PrepackagedFilesystemProvider');

class PrepackagedFilesystemProvider implements FileSystemProviderInterface {
    constructor(private _blob: PrepackagedFilesystemProvider.BlobInterface) {}

    readBinaryFileSync(name: string): Uint8Array {
        var file = this._getFile(name);

        if (!file.hasOwnProperty('base64')) throw new Error(
            'file not available as raw data');

        if (!file.hasOwnProperty('_base64'))
            file._base64 = base64.decode(file.base64);

        return file._base64;
    }

    readTextFileSync(name: string): string {
        var file = this._getFile(name);

        if (!file.hasOwnProperty('plain')) throw new Error(
            'file not available as plain text');

        return file.plain;
    }

    private _getFile(name: string): PrepackagedFilesystemProvider.FileInterface {
        if (!this._blob.hasOwnProperty(name)) throw new Error('file not found');
        return this._blob[name];
    }
}

module PrepackagedFilesystemProvider {
    export interface FileInterface {
        base64?: string;
        _base64?: Uint8Array;

        plain?: string;
    }

    export interface BlobInterface {
        [name: string]: FileInterface;
    }
}

export = PrepackagedFilesystemProvider;
