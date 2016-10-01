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

        this.reset();
    }

    reset(): void {
        this._bank = this._bank0;
    }

    read(address: number): number {
        address &= 0x0FFF;

        this._handleBankswitch(address);

        return this._bank[address];
    }

    peek(address: number): number {
        return this._bank[address & 0x0FFF];
    }

    write(address: number, value: number): void {
        this._handleBankswitch(address & 0x0FFF);
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

    private _handleBankswitch(address: number): void {
        switch (address) {
            case 0x0FF8:
                this._bank = this._bank0;
                break;

            case 0x0FF9:
                this._bank = this._bank1;
                break;
        }
    }

    protected _bank: Uint8Array = null;
    protected _bank0 = new Uint8Array(0x1000);
    protected _bank1 = new Uint8Array(0x1000);

}

export default CartridgeF8;
