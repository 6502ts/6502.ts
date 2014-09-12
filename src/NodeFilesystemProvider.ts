/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="./FilesystemProviderInterface"/>

import fs = require('fs');

class NodeFilesystemProvider implements FileSystemProviderInterface {
    readBinaryFileSync(name: string): FileBufferInterface {
        return fs.readFileSync(name);
    }

    readTextFileSync(name: string): string {
        return fs.readFileSync(name).toString('utf8');
    }
}

export = NodeFilesystemProvider;
