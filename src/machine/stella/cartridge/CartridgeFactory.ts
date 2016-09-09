import Cartridge2k from './Cartridge2k';
import Cartridge4k from './Cartridge4k';
import CartridgeF8 from './CartridgeF8';
import CartridgeF6 from './CartridgeF6';
import CartridgeE0 from './CartridgeE0';
import CartridgeFE from './CartridgeFE';
import Cartridge3F from './Cartridge3F';
import CartridgeUA from './CartridgeUA';
import CartridgeFA from './CartridgeFA';
import CartridgeE7 from './CartridgeE7';
import CartridgeF0 from './CartridgeF0';
import CartridgeF4 from './CartridgeF4';
import CartridgeFA2 from './CartridgeFA2';

import CartridgeInfo from './CartridgeInfo';
import CartridgeDetector from './CartridgeDetector';
import CartridgeInterface from './CartridgeInterface';


export default class CartridgeFactory {

    createCartridge(
        buffer: {[i: number]: number; length: number},
        cartridgeType?: CartridgeInfo.CartridgeType
    ): CartridgeInterface {

        if (typeof(cartridgeType) === 'undefined') {
            const detector = new CartridgeDetector();

            cartridgeType = detector.detectCartridgeType(buffer);
        }

        switch (cartridgeType) {
            case CartridgeInfo.CartridgeType.vanilla_2k:
                return new Cartridge2k(buffer);

            case CartridgeInfo.CartridgeType.vanilla_4k:
                return new Cartridge4k(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_F8:
                return new CartridgeF8(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_E0:
                return new CartridgeE0(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_3F:
                return new Cartridge3F(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_FE:
                return new CartridgeFE(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_UA:
                return new CartridgeUA(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_12k_FA:
                return new CartridgeFA(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_16k_F6:
                return new CartridgeF6(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_16k_E7:
                return new CartridgeE7(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_FA2:
                return new CartridgeFA2(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_32k_F4:
                return new CartridgeF4(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_64k_F0:
                return new CartridgeF0(buffer);

            default:
                throw new Error(`invalid or unsupported cartridge image`);
        }
    }

}
