import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';

class Cartridge2k extends AbstractCartridge {

    constructor (buffer: {[i: number]: number; length: number}) {
        super();

        if (buffer.length !== 0x0800) {
            throw new Error(`buffer is not a 2k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < buffer.length && i < 0x0800; i++)
                this._rom[0x07FF - i] = buffer[buffer.length - 1 - i];
    }

    read(address: number): number {
        // Mask out A11 - A15
        return this._rom[address & 0x07FF];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.vanilla_2k;
    }

    // A11 - A15 masked out -> 0x0800 bytes of ROM
    protected _rom = new Uint8Array(0x0800);
}

export default Cartridge2k;
