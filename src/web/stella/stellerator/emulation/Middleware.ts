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

class EmulationMiddleware {

    getMiddleware(): redux.Middleware {
        return this._middleware.bind(this);
    }

    setEmulationService(emulationService: EmulationServiceInterface): this {
        this._emulationService = emulationService;

        return this;
    }

    private _middleware: redux.Middleware =
        ((api: redux.MiddlewareAPI<State>) => (next: (a: any) => void) => (a: redux.Action): any =>
    {
        if (!a || !this._emulationService) {
            return next(a);
        }

        const initialState = api.getState();

        switch (a.type) {
            case Type.start:
                if (initialState.currentCartridge) {
                    (a as StartAction).hash = initialState.currentCartridge.hash;

                    return this._emulationService
                        .start(
                            initialState.currentCartridge.buffer,
                            this._createStellaConfig(initialState.currentCartridge),
                            initialState.currentCartridge.cartridgeType
                        )
                        .then(() => {
                            this._updateControlPanelState(initialState.emulationState);
                            api.dispatch(push('/emulation'));
                            next(a);
                        });
                }

                break;

            case Type.pause:
                return this._emulationService.pause().then(() => next(a));

            case Type.resume:
                return this._emulationService.resume().then(() => next(a));

            case Type.changeDifficulty:
            case Type.changeTvMode:
                return Promise.resolve(next(a))
                    .then(() => this._updateControlPanelState(api.getState().emulationState));

            case Type.setEnforceRateLimit:
                return this._emulationService.setRateLimit((a as SetEnforceRateLimitAction).enforce)
                    .then(() => next(a));
        }

        return next(a);

    }) as any;

    private _updateControlPanelState(state: EmulationState): void {
        if (!this._emulationService) {
            return;
        }

        const context = this._emulationService.getEmulationContext();

        if (!context) {
            return;
        }

        const controlPanel = context.getControlPanel();

        controlPanel.getDifficultySwitchP0().toggle(state.difficultyPlayer0);
        controlPanel.getDifficultySwitchP1().toggle(state.difficultyPlayer1);
        controlPanel.getColorSwitch().toggle(state.tvMode);
    }

    private _createStellaConfig(cartridge: Cartridge): StellaConfig {
        return new StellaConfig(
            cartridge.tvMode,
            undefined,
            cartridge.rngSeedAuto ? -1 : cartridge.rngSeed,
            cartridge.emulatePaddles
        );
    }

    private _emulationService: EmulationServiceInterface = null;

}

export default EmulationMiddleware;
