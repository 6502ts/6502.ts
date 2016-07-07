import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import * as cartridgeUtil from './util';

class CartridgeUA extends AbstractCartridge {

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
        return this._bank[address & 0x0FFF];
    }

    write(address: number, value: number): void {
        super.write(address, value);
    }

    tiaWrite(address: number, value: number): void {
        this._tiaAccess(address);
    }

    tiaRead(address: number): void {
        this._tiaAccess(address);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_UA;
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer,
            [
                [0x8D, 0x40, 0x02],  // STA $240
                [0xAD, 0x40, 0x02],  // LDA $240
                [0xBD, 0x1F, 0x02]   // LDA $21F,X
            ]
        );

        for (let i = 0; i < signatureCounts.length; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    private _tiaAccess(address: number): void {
        switch (address) {
            case 0x0220:
                this._bank = this._bank0;
                break;

            case 0x0240:
                this._bank = this._bank1;
                break;
        }
    }

    protected _bank: Uint8Array = null;
    protected _bank0 = new Uint8Array(0x1000);
    protected _bank1 = new Uint8Array(0x1000);

}

export default CartridgeUA;
