import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import * as cartridgeUtil from './util';
import Bus from '../Bus';

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

    setBus(bus: Bus): this {
        this._bus = bus;

        bus.event.read.addHandler(CartridgeUA._onBusAccess, this);
        bus.event.write.addHandler(CartridgeUA._onBusAccess, this);

        return this;
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

    private static _onBusAccess(accessType: Bus.AccessType, self: CartridgeUA): void {
        switch (self._bus.getLastAddresBusValue()) {
            case 0x0220:
                self._bank = self._bank0;
                break;

            case 0x0240:
                self._bank = self._bank1;
                break;
        }
    }

    private _bus: Bus = null;

    private _bank: Uint8Array = null;
    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);

}

export default CartridgeUA;
