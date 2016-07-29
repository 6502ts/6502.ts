import * as redux from 'redux';
import {push} from 'react-router-redux';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';
import EmulationState from '../state/Emulation';
import State from '../state/State';
import Cartridge from '../state/Cartridge';
import StellaConfig from '../../../../machine/stella/Config';

import {
    Type,
    StartAction,
    SetEnforceRateLimitAction
} from '../actions/emulation';

function createStellaConfig(cartridge: Cartridge): StellaConfig {
    return new StellaConfig(cartridge.tvMode);
}

export function create(emulationService: EmulationServiceInterface): redux.Middleware {

    return ((api: redux.MiddlewareAPI<State>) => (next: (a: any) => void) => (a: redux.Action): any => {
        if (!a) {
            next(a);
        }

        const initialState = api.getState();

        switch (a.type) {
            case Type.start:
                if (initialState.currentCartridge) {
                    (a as StartAction).hash = initialState.currentCartridge.hash;

                    return emulationService.start(
                        initialState.currentCartridge.buffer,
                        createStellaConfig(initialState.currentCartridge),
                        initialState.currentCartridge.cartridgeType
                    )
                    .then(() => {
                        updateControlPanelState(initialState.emulationState, emulationService);
                        api.dispatch(push('/emulation'));
                        next(a);
                    });
                }

                break;

            case Type.pause:
                return emulationService.pause().then(() => next(a));

            case Type.resume:
                return emulationService.resume().then(() => next(a));

            case Type.changeDifficulty:
            case Type.changeTvMode:
                return Promise.resolve(next(a))
                    .then(() => updateControlPanelState(api.getState().emulationState, emulationService));

            case Type.setEnforceRateLimit:
                return emulationService.setRateLimit((a as SetEnforceRateLimitAction).enforce)
                    .then(() => next(a));
        }

        return next(a);

    }) as any;

}

function updateControlPanelState(state: EmulationState, emulationService: EmulationServiceInterface): void {
    const context = emulationService.getEmulationContext();

    if (!context) {
        return;
    }

    const controlPanel = context.getControlPanel();

    controlPanel.getDifficultySwitchP0().toggle(state.difficultyPlayer0);
    controlPanel.getDifficultySwitchP1().toggle(state.difficultyPlayer1);
    controlPanel.getColorSwitch().toggle(state.tvMode);
}
