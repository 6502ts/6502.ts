import Cartridge2k from './Cartridge2k';
import Cartridge4k from './Cartridge4k';
import CartridgeInterface from './CartridgeInterface';

export default class CartridgeFactory {

    createCartridge(buffer: {[i: number]: number; length: number}): CartridgeInterface {
        switch (buffer.length) {
            case 2048:
                return new Cartridge2k(buffer);

            case 4096:
                return new Cartridge4k(buffer);

            default:
                throw new Error(`invalid cartridge image`);
        }
    }

}
