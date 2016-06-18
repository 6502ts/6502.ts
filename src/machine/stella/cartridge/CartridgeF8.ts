import AbstractCartridge from './AbstractCartridge';

class CartridgeF8 extends AbstractCartridge {

    constructor(buffer: {[i: number]: number, length: number}) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
        }

        this._bank = this._bank0;
    }

    read(address: number): number {
        address = address & 0x0FFF;

        switch (address) {
            case 0x0FF8:
                this._bank = this._bank0;
                return 0;

            case 0xFF9:
                this._bank = this._bank1;
                return 0;

            default:
                return this._bank[address];
        }
    }

    protected _bank: Uint8Array = null;
    protected _bank0 = new Uint8Array(0x1000);
    protected _bank1 = new Uint8Array(0x1000);

}

export default CartridgeF8;
