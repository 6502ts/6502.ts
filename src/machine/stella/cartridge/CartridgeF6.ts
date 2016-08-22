import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class CartridgeF6 extends AbstractCartridge {

    constructor(
        buffer: {[i: number]: number, length: number},
        private _supportSC: boolean = true

    ) {
        super();

        if (buffer.length !== 0x4000) {
            throw new Error(`buffer is not a 16k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
            this._bank2[i] = buffer[0x2000 + i];
            this._bank3[i] = buffer[0x3000 + i];
        }

        this._bank = this._bank0;
    }

    read(address: number): number {
        address &= 0x0FFF;

        if (this._hasSC && address >= 0x0080 && address < 0x0100) {
            return this._saraRAM[address - 0x80];
        }

        switch (address) {
            case 0x0FF6:
                this._bank = this._bank0;
                break;

            case 0x0FF7:
                this._bank = this._bank1;
                break;

            case 0x0FF8:
                this._bank = this._bank2;
                break;

            case 0x0FF9:
                this._bank = this._bank3;
                break;
        }

        return this._bank[address];
    }

    write(address: number, value: number): void {
        address &= 0x0FFF;

        if (address < 0x80 && this._supportSC) {
            this._hasSC = true;
            this._saraRAM[address] = value & 0xFF;

            return;
        }

        switch (address) {
            case 0x0FF6:
                this._bank = this._bank0;
                break;

            case 0x0FF7:
                this._bank = this._bank1;
                break;

            case 0x0FF8:
                this._bank = this._bank2;
                break;

            case 0x0FF9:
                this._bank = this._bank3;
                break;

            default:
                super.write(address, value);
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_16k_F6;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._saraRAM.length; i++) {
            this._saraRAM[i] = rng.int(0xFF);
        }
    }

    private _bank: Uint8Array = null;
    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank2 = new Uint8Array(0x1000);
    private _bank3 = new Uint8Array(0x1000);

    private _hasSC = false;
    private _saraRAM = new Uint8Array(0x80);
}

export default CartridgeF6;
