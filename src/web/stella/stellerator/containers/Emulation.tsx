/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import State from '../state/State';
import { GuiMode } from '../model/types';

import {
    pause as pauseEmulation,
    userPause as userPauseEmulation,
    resume as resumeEmulation,
    reset as resetEmulation,
    changeDifficulty,
    changeTvMode,
    enforceRateLimit
} from '../actions/emulation';

import EmulationComponent from '../components/Emulation';

function mapStateToProps(state: State): EmulationComponent.Props {
    return {
        enabled: state.guiState.mode === GuiMode.run,
        emulationState: state.emulationState.emulationState,
        difficultyPlayer0: state.emulationState.difficultyPlayer0,
        difficultyPlayer1: state.emulationState.difficultyPlayer1,
        tvModeSwitch: state.emulationState.tvMode,
        enforceRateLimit: state.emulationState.enforceRateLimit,
        smoothScaling: state.settings.smoothScaling,
        webGlRendering: state.settings.webGlRendering,
        povEmulation: state.settings.povEmulation,
        gamma: state.settings.gamma,
        pausedByUser: state.emulationState.pausedByUser,
        syncRendering: state.settings.syncRendering
    };
}

// tslint:disable-next-line:variable-name
const EmulationContainer = connect(mapStateToProps, {
    navigateAway: () => push('/cartridge-manager'),
    pauseEmulation,
    resumeEmulation,
    resetEmulation,
    userPauseEmulation,

    onSwitchDifficultyPlayer0: (state: boolean) => changeDifficulty(0, state),
    onSwitchDifficultyPlayer1: (state: boolean) => changeDifficulty(1, state),
    onSwitchTvMode: (state: boolean) => changeTvMode(state),
    onEnforceRateLimitChange: (enforce: boolean) => enforceRateLimit(enforce)
})(EmulationComponent as any);

export default EmulationContainer;
