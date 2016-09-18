import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

import CartridgeState from '../state/Cartridge';

export interface Type {

    id?: number;
    name: string;
    hash: string;
    buffer: Uint8Array;
    tvMode: 'pal'|'secam'|'ntsc';
    cartridgeType: string;
    emulatePaddles: boolean;
    rngSeedAuto: boolean;
    rngSeed: number;

}

export function fromState(state: CartridgeState, id?: number): Type {
    let tvMode: 'pal'|'ntsc'|'secam';

    switch (state.tvMode) {
        case StellaConfig.TvMode.ntsc:
            tvMode = 'ntsc';
            break;

        case StellaConfig.TvMode.pal:
            tvMode = 'pal';
            break;

        case StellaConfig.TvMode.secam:
            tvMode = 'secam';
            break;

        default:
            throw new Error(`invalid tv mode ${state.tvMode}`);
    }

    const cartridge: Type = {
        name: state.name,
        buffer: state.buffer,
        hash: state.hash,
        emulatePaddles: state.emulatePaddles,
        tvMode,
        cartridgeType: CartridgeInfo.CartridgeType[state.cartridgeType],
        rngSeedAuto: state.rngSeedAuto,
        rngSeed: state.rngSeed
    };

    if (typeof(id) !== 'undefined') {
        cartridge.id = id;
    }

    return cartridge;
}

export function toState(cartridge: Type): CartridgeState {
    let tvMode: StellaConfig.TvMode;

    switch (cartridge.tvMode) {
        case 'ntsc':
            tvMode = StellaConfig.TvMode.ntsc;
            break;

        case 'pal':
            tvMode = StellaConfig.TvMode.pal;
            break;

        case 'secam':
            tvMode = StellaConfig.TvMode.secam;
            break;

        default:
            throw new Error(`invalid tv mode`);
    }

    return new CartridgeState({
        name: cartridge.name,
        buffer: cartridge.buffer,
        hash: cartridge.hash,
        emulatePaddles: cartridge.emulatePaddles,
        tvMode,
        cartridgeType: (CartridgeInfo.CartridgeType as any)[cartridge.cartridgeType],
        rngSeedAuto: cartridge.rngSeedAuto,
        rngSeed: cartridge.rngSeed
    });
}

export type indexType = number;
