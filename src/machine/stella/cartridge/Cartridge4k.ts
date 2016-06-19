import AbstractCartridge from './AbstractCartridge';

class Cartridge4k extends AbstractCartridge {

    constructor (buffer: {[i: number]: number; length: number}) {
        super();

        if (buffer.length !== 0x1000) {
            throw new Error(`buffer is not an 4k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000 && i < buffer.length; i++)
            this._rom[0x0FFF - i] = buffer[buffer.length -1 - i];
    }

    read(address: number): number {
        // Mask out A12 - A15
        return this._rom[address & 0x0FFF];
    }

    // A12 - A15 masked out -> 0x1000 bytes of ROM
    protected _rom = new Uint8Array(0x1000);
}

export default Cartridge4k;
