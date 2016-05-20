import AbstractCartridge from './AbstractCartridge';

class Cartridge2k extends AbstractCartridge {

    constructor (buffer: {[i: number]: number; length: number}) {
        super();

        for (let i = 0; i < buffer.length && i < 0x0800; i++)
                this.rom[0x07FF - i] = buffer[buffer.length - 1 - i];
    }

    read(address: number): number {
        // Mask out A11 - A15
        return this.rom[address & 0x07FF];
    }

    // A11 - A15 masked out -> 0x0800 bytes of ROM
    rom = new Uint8Array(0x0800);
}

export default Cartridge2k;
