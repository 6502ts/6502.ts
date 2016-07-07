import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import * as cartridgeUtil from './util';

class CartridgeFA extends AbstractCartridge {

    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x3000) {
            throw new Error(`buffer is not a 12k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
            this._bank2[i] = buffer[0x2000 + i];
        }

        this._bank = this._bank0;
    }

    read(address: number): number {
        address &= 0x0FFF;

        this._handleBankswitch(address);

        if (address >= 0x0100 && address < 0x0200) {
            return this._ram[address & 0xFF];
        } else {
            return this._bank[address];
        }
    }

    write(address: number, value: number): void {
        address &= 0x0FFF;

        this._handleBankswitch(address);

        if (address < 0x0100) {
            this._ram[address] = value & 0xFF;
        } else {
            super.write(address, value);
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_12k_FA;
    }

    private _handleBankswitch(address: number): void {
        switch (address) {
            case 0x0FF8:
                this._bank = this._bank0;
                break;

            case 0x0FF9:
                this._bank = this._bank1;
                break;

            case 0x0FFA:
                this._bank = this._bank2;
                break;
        }
    }

    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank2 = new Uint8Array(0x1000);

    private _bank: Uint8Array;

    private _ram = new Uint8Array(0x0100);
}

export default CartridgeFA;
