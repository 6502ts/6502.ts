interface BusInterface {
    read(address: number): number;

    peek(address: number): number;

    readWord(address: number): number;

    write(address: number, value: number): void;

    poke(address: number, value: number): void;
}

export default BusInterface;
