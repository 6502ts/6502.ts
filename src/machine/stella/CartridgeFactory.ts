import Cartridge2k from './cartridge/Cartridge2k';
import Cartridge4k from './cartridge/Cartridge4k';
import CartridgeF8 from './cartridge/CartridgeF8';
import CartridgeInterface from './CartridgeInterface';

export default class CartridgeFactory {

    createCartridge(buffer: {[i: number]: number; length: number}): CartridgeInterface {
        switch (buffer.length) {
            case 0x0800:
                return new Cartridge2k(buffer);

            case 0x1000:
                return new Cartridge4k(buffer);

            case 0x2000:
                return new CartridgeF8(buffer);

            default:
                throw new Error(`invalid cartridge image`);
        }
    }

}
