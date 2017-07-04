/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

import {connect} from 'react-redux';

import State from '../state/State';
import SettingsComponent from '../components/Settings';

import {
    setSmoothScaling,
    setWebGlRendering,
    setGamma,
    setUseWorker,
    setMergeFrames,
    setVolume
} from '../actions/settings';

function mapStateToProps(state: State): SettingsComponent.Props {
    return {
        smoothScaling: state.settings.smoothScaling,
        webGlRendering: state.settings.webGlRendering,
        gamma: state.settings.gamma,
        useWorker: state.settings.useWorker,
        mergeFrames: state.settings.mergeFrames,
        volume: state.settings.volume
    };
}

// tslint:disable-next-line:variable-name
const SettingsContainer = connect(mapStateToProps, {
    onToggleSmoothScaling: setSmoothScaling,
    onToggleWebGlRendering: setWebGlRendering,
    onChangeGamma: setGamma,
    onToggleUseWorker: setUseWorker,
    onToggleMergeFrames: setMergeFrames,
    onChangeVolume: setVolume
})(SettingsComponent);

export default SettingsContainer;
