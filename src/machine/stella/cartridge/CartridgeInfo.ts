class CartridgeInfo {

}

module CartridgeInfo {

    export enum CartridgeType {
        vanilla_2k,
        vanilla_4k,

        bankswitch_8k_F8,
        bankswitch_8k_E0,
        bankswitch_8k_3F,
        bankswitch_8k_FE,
        bankswitch_8k_UA,

        bankswitch_12k_FA,

        bankswitch_16k_F6,
        bankswitch_16k_E7,

        bankswitch_64k_F0,

        unknown
    }

    export function describeCartridgeType(cartridgeType: CartridgeType): string {
        switch (cartridgeType) {
            case CartridgeType.vanilla_2k:
                return 'plain 2k';

            case CartridgeType.vanilla_4k:
                return 'plain 4k';

            case CartridgeType.bankswitch_8k_F8:
                return 'bankswitched 8k, F8 (Atari) scheme';

            case CartridgeType.bankswitch_8k_E0:
                return 'bankswitched 8k, E0 (Parker Bros.) scheme';

            case CartridgeType.bankswitch_8k_3F:
                return 'bankswitched 8k, 3F (Tigervision) scheme';

            case CartridgeType.bankswitch_8k_FE:
                return 'bankswitched 8k, FE (Activision) scheme';

            case CartridgeType.bankswitch_8k_UA:
                return 'bankswitched 8k, UA (Pleiades) scheme';

            case CartridgeType.bankswitch_12k_FA:
                return 'bankswitched 12k, FA (CBS) scheme';

            case CartridgeType.bankswitch_16k_F6:
                return 'bankswitched 16k, F6 (Atari) scheme';

            case CartridgeType.bankswitch_16k_E7:
                return 'bankswitched 16k, E7 (M-Network) scheme';

            case CartridgeType.bankswitch_64k_F0:
                return 'bankswitched 64k, F0 (Megaboy) scheme';

            case CartridgeType.unknown:
                return 'unkown';
        }
    }

}

export default CartridgeInfo;
