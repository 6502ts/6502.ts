import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';
import * as cartridgeUtil from '../../../../machine/stella/cartridge/util';

export default class Cartridge {

    constructor(
        public name: string,
        public buffer: cartridgeUtil.BufferInterface,
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
            this.name === other.name &&
            this.hash === other.hash &&
            this.tvMode === other.tvMode &&
            this.cartridgeType === other.cartridgeType
        );
    }

    tvMode: StellaConfig.TvMode;
    cartridgeType: CartridgeInfo.CartridgeType;

}
