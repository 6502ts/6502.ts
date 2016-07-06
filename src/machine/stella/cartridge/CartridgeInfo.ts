class CartridgeInfo {

}

module CartridgeInfo {

    export enum CartridgeType {
        vanilla_2k,
        vanilla_4k,

        bankswitch_8k_F8,
        bankswitch_8k_E0,

        bankswitch_16k_F6,

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

            case CartridgeType.bankswitch_16k_F6:
                return 'bankswitched 16k, F6 (Atari) scheme';

            case CartridgeType.unknown:
                return 'unkown';
        }
    }

}

export default CartridgeInfo;
