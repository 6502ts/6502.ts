/// <reference path="../../typings/node/node.d.ts"/>

'use strict';

import fs = require('fs');
import FileSystemProviderInterface = require('./FilesystemProviderInterface');

class NodeFilesystemProvider implements FileSystemProviderInterface {
    readBinaryFileSync(name: string): FileSystemProviderInterface.FileBufferInterface {
        return fs.readFileSync(name);
    }

    readTextFileSync(name: string): string {
        return fs.readFileSync(name).toString('utf8');
    }
}

export = NodeFilesystemProvider;
