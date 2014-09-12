interface FileSystemProviderInterface {
    readBinaryFileSync(name: string): FileBufferInterface;

    readTextFileSync(name: string): string;
}

interface FileBufferInterface {
    [index: number]: number;
    length: number;
}
