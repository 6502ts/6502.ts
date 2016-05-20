import AbstractCartridge from './AbstractCartridge';

class Cartridge4k extends AbstractCartridge {

    constructor (buffer: {[i: number]: number; length: number}) {
        super();

        for (let i = 0; i < 0x1000 && i < buffer.length; i++)
            this.rom[0x0FFF - i] = buffer[buffer.length -1 - i];
    }

    read(address: number): number {
        // Mask out A12 - A15
        return this.rom[address & 0x0FFF];
    }

    // A12 - A15 masked out -> 0x1000 bytes of ROM
    rom = new Uint8Array(0x1000);
}

export default Cartridge4k;
