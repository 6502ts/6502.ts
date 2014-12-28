/// <reference path="../../typings/node/node.d.ts"/>

'use strict';

import fs = require('fs');
import FileSystemProviderInterface = require('./FilesystemProviderInterface');
import AbstractFileSystemProvider = require('./AbstractFileSystemProvider');

class NodeFilesystemProvider extends AbstractFileSystemProvider
    implements FileSystemProviderInterface
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
}

export = NodeFilesystemProvider;
