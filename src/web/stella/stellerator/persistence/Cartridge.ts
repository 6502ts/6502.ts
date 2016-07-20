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
        tvMode,
        cartridgeType: CartridgeInfo.CartridgeType[state.cartridgeType]
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
            throw new Error(`invalid tv mode ${cartridge.tvMode}`);
    }

    return new CartridgeState(
        cartridge.name,
        cartridge.buffer,
        cartridge.hash, {
            tvMode: tvMode,
            cartridgeType: (CartridgeInfo.CartridgeType as any)[cartridge.cartridgeType]
        }
    );
}

export type indexType = number;
