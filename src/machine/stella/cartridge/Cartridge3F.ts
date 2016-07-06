import AbstractCartridge from './AbstractCartridge';
import * as cartridgeUtil from './util';
import CartridgeInfo from './CartridgeInfo';

class Cartridge3F extends AbstractCartridge {

    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: invalid length ${buffer.length}`);
        }

        for (let i = 0; i < 4; i++) {
            this._banks[i] = new Uint8Array(0x0800);
        }

        this._bank0 = this._bank1 = this._banks[3];

        for (let i = 0; i < 0x0800; i++) {
            for (let j = 0; j < 4; j++) {
                this._banks[j][i] = buffer[0x0800 * j + i];
            }
        }
    }

    read(address: number): number {
        address &= 0x0FFF;

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07FF];
    }

    tiaWrite(address: number, value: number): void {
        if (address <= 0x003F) {
            this._bank0 = this._banks[value & 0x03];
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_3F;
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signature shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            [[ 0x85, 0x3F ]]  // STA $3F
        );

        return signatureCounts[0] >= 2;
    }

    private _banks = new Array<Uint8Array>(4);
    private _bank0: Uint8Array;
    private _bank1: Uint8Array;

}

export default Cartridge3F;
