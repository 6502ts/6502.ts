/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as redux from 'redux';

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
                            next(a);
                        });
                }

                break;

            case Type.pause:
            case Type.userPause:
                return this._emulationService.pause().then(() => next(a));

            case Type.resume:
                return this._emulationService.resume().then(() => next(a));

            case Type.reset:
                return this._emulationService.reset().then(() => next(a));

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
            cartridge.audioEnabled,
            cartridge.rngSeedAuto ? -1 : cartridge.rngSeed,
            cartridge.emulatePaddles
        );
    }

    private _emulationService: EmulationServiceInterface = null;

}

export default EmulationMiddleware;
