import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';
import * as cartridgeUtil from '../../../../machine/stella/cartridge/util';

export default class Cartridge {

    constructor(
        public name: string,
        public buffer: cartridgeUtil.BufferInterface,
        {
            tvMode = StellaConfig.TvMode.ntsc,
            cartridgeType = CartridgeInfo.CartridgeType.unknown
        }: {
            tvMode?: StellaConfig.TvMode,
            cartridgeType?: CartridgeInfo.CartridgeType;
        } = {}
    ) {
        this.tvMode = tvMode;
        this.cartrdgeType = cartridgeType;
    }

    tvMode: StellaConfig.TvMode;
    cartrdgeType: CartridgeInfo.CartridgeType;

}
