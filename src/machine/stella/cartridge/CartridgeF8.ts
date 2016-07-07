import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import * as cartridgeUtil from './util';

class CartridgeF8 extends AbstractCartridge {

    constructor(buffer: cartridgeUtil.BufferInterface) {
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
        address &= 0x0FFF;

        switch (address) {
            case 0x0FF8:
                this._bank = this._bank0;
                return 0;

            case 0x0FF9:
                this._bank = this._bank1;
                return 0;

            default:
                return this._bank[address];
        }
    }

    write(address: number, value: number): void {
        switch (address & 0x0FFF) {
            case 0x0FF8:
                this._bank = this._bank0;
                return;

            case 0x0FF9:
                this._bank = this._bank1;
                return;

            default:
                return super.write(address, value);
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_F8;
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer,
            [[0x8D, 0xF9, 0x1F]]  // STA $1FF9
        );

        return signatureCounts[0] >= 2;
    }

    protected _bank: Uint8Array = null;
    protected _bank0 = new Uint8Array(0x1000);
    protected _bank1 = new Uint8Array(0x1000);

}

export default CartridgeF8;
