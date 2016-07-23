import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

export default class Cartridge implements Changeset {

    constructor(changes?: Changeset, old?: Cartridge) {
        return Object.assign(this, old, changes);
    }

    equals(other: Cartridge): boolean {
        return (
            !!other &&
            this.name === other.name &&
            this.hash === other.hash &&
            this.tvMode === other.tvMode &&
            this.cartridgeType === other.cartridgeType
        );
    }

    name = '';
    buffer: Uint8Array = null;
    hash = '';
    tvMode = StellaConfig.TvMode.ntsc;;
    cartridgeType = CartridgeInfo.CartridgeType.unknown;

}

interface Changeset {
    name?: string;
    buffer?: Uint8Array;
    hash?: string;
    tvMode?: StellaConfig.TvMode;
    cartridgeType?: CartridgeInfo.CartridgeType;
}
