import CartridgeInfo from './CartridgeInfo';
import CartridgeE0 from './CartridgeE0';
import * as cartridgeUtil from './util';

class CartridgeDetector {

    detectCartridgeType(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        switch (buffer.length) {
            case 0x0800:
                return CartridgeInfo.CartridgeType.vanilla_2k;

            case 0x1000:
                return CartridgeInfo.CartridgeType.vanilla_4k;

            case 0x2000:
                return this._detect8k(buffer);

            case 0x4000:
                return CartridgeInfo.CartridgeType.bankswitch_16k_F6;

            default:
                return CartridgeInfo.CartridgeType.unknown;
        }
    }

    private _detect8k(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        if (CartridgeE0.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_8k_E0;
        } else {
            return CartridgeInfo.CartridgeType.bankswitch_8k_F8;
        }
    }

}

export default CartridgeDetector;
