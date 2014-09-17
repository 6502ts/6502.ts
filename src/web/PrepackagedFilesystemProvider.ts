/// <reference path="../FilesystemProviderInterface.d.ts"/>

class PrepackagedFilesystemProvider implements FileSystemProviderInterface {
    readBinaryFileSync(name: string): Array<number> {
        throw new Error('file not found');
    }

    readTextFileSync(name: string): string {
        throw new Error('file not found');
    }
}

export = PrepackagedFilesystemProvider;
