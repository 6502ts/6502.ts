interface FileSystemProviderInterface {
    readBinaryFileSync(name: string): FileSystemProviderInterface.FileBufferInterface;

    readTextFileSync(name: string): string;

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

}


export = FileSystemProviderInterface;
