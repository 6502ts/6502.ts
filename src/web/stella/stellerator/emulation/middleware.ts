import * as redux from 'redux';
import {push} from 'react-router-redux';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';
import State from '../state/State';
import Cartridge from '../state/Cartridge';
import StellaConfig from '../../../../machine/stella/Config';

import {
    Type,
    StartAction
} from '../actions/emulation';

function createStellaConfig(cartridge: Cartridge): StellaConfig {
    return new StellaConfig(cartridge.tvMode);
}

export function create(emulationService: EmulationServiceInterface): redux.Middleware {

    return ((api: redux.MiddlewareAPI<State>) => (next: (a: any) => void) => (a: redux.Action): any => {
        if (!a) {
            next(a);
        }

        const state = api.getState();

        switch (a.type) {
            case Type.start:
                if (state.currentCartridge) {
                    (a as StartAction).hash = state.currentCartridge.hash;

                    return emulationService.start(
                        state.currentCartridge.buffer,
                        createStellaConfig(state.currentCartridge),
                        state.currentCartridge.cartridgeType
                    )
                    .then(() => (api.dispatch(push('/emulation')), next(a)));
                }

                break;

            case Type.pause:
                return emulationService.pause().then(() => next(a));

            case Type.resume:
                return emulationService.resume().then(() => next(a));
        }

        return next(a);

    }) as any;

}
