interface FileSystemProviderInterface {
    readBinaryFileSync(name: string): FileSystemProviderInterface.FileBufferInterface;

    readTextFileSync(name: string): string;

    readDirSync(name: string): Array<string>;

    getTypeSync(name: string): FileSystemProviderInterface.FileType;

    chdir(path: string): void;

    pushd(path?: string): void;

    popd(): string;

    cwd(): string;
}

module FileSystemProviderInterface {

    export interface FileBufferInterface {
        [index: number]: number;
        length: number;
    }

    export const enum FileType {DIRECTORY, FILE}

}


export = FileSystemProviderInterface;
