interface MemoryInterface {
    read(address: number): number;

    readWord(address: number): number;

    write(address: number, value: number): void;

    peek(address: number): number;

    poke(address: number, value: number): void;
}

module MemoryInterface {

    export interface MemoryBlockInterface {
        [index: number]: number;
        length: number;
    }

}

export = MemoryInterface;
