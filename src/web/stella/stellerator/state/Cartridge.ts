import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

export default class Cartridge {

    constructor(
        public name: string,
        public buffer: Uint8Array,
        public hash: string,
        {
            tvMode = StellaConfig.TvMode.ntsc,
            cartridgeType = CartridgeInfo.CartridgeType.unknown
        }: {
            tvMode?: StellaConfig.TvMode,
            cartridgeType?: CartridgeInfo.CartridgeType;
        } = {}
    ) {
        this.tvMode = tvMode;
        this.cartridgeType = cartridgeType;
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

    tvMode: StellaConfig.TvMode;
    cartridgeType: CartridgeInfo.CartridgeType;

}
