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


import {connect} from 'react-redux';

import {
    changeCartridgeType,
    changePaddleEmulation,
    changeName,
    changeTvMode,
    changeRngSeedStrategy,
    changeRngSeed,
    toggleAudioEnabled
} from '../../actions/currentCartridge';

import {saveCurrentCartride} from '../../actions/root';
import CartridgeSettingsComponent from '../../components/cartridge_manager/CartridgeSettings';
import State from '../../state/State';

import StellaConfig from '../../../../../machine/stella/Config';
import CartridgeInfo from '../../../../../machine/stella/cartridge/CartridgeInfo';

function mapStateToProps(state: State): CartridgeSettingsComponent.Props {
    return {
        name: state.currentCartridge ? state.currentCartridge.name : '',
        tvMode: state.currentCartridge ? state.currentCartridge.tvMode : StellaConfig.TvMode.ntsc,
        cartridgeType: state.currentCartridge ? state.currentCartridge.cartridgeType : CartridgeInfo.CartridgeType.unknown,
        emulatePaddles: state.currentCartridge ? state.currentCartridge.emulatePaddles : true,
        visible: !!state.currentCartridge,
        rngSeedAuto: state.currentCartridge ? state.currentCartridge.rngSeedAuto : true,
        rngSeedValue: state.currentCartridge ? state.currentCartridge.rngSeed : 0,
        audioEnabled: state.currentCartridge ? state.currentCartridge.audioEnabled : true
    };
}

const CartridgeSettingsContainer = connect(
    mapStateToProps, {
        onNameChange: changeName,
        onKeyEnter: saveCurrentCartride,
        onTvModeChange: changeTvMode,
        onCartridgeTypeChange: changeCartridgeType,
        onTogglePaddleEmulation: changePaddleEmulation,
        onChangeSeedStrategy: changeRngSeedStrategy,
        onChangeSeedValue: changeRngSeed,
        onToggleAudioEnabled: toggleAudioEnabled
    }
)(CartridgeSettingsComponent);
export default CartridgeSettingsContainer;
