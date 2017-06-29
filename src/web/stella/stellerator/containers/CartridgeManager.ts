/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2017 Christian Speckner & contributors
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
import {Dispatch} from 'redux';

import {
    default as CartridgeManagerComponent,
    DataProps,
    HandlerProps
} from '../components/CartridgeManager';
import Cartridge from '../model/Cartridge';
import State from '../state/State';

import {
    deleteCurrentCartridge,
    saveCurrentCartride,
} from '../actions/root';
import {
    changeCartridgeType,
    changePaddleEmulation,
    changeName,
    changeTvMode,
    changeRngSeedStrategy,
    changeRngSeed,
    toggleAudioEnabled
} from '../actions/currentCartridge';
import {
    closeSelectPendingChangesModal,
    closeLoadPendingChangesModal
} from '../actions/guiState';
import {
    runCurrentCartridge,
    uploadNewCartridge,
    selectCartridge,
    confirmLoad,
    confirmSelect
} from '../actions/cartridgeManager';

function mapStateToProps(state: State): DataProps {
    return {
        cartridges: state.cartridges,
        currentCartridge: state.currentCartridge,
        pendingChanges: state.currentCartridge && !Cartridge.equals(
            state.currentCartridge,
            state.cartridges[state.currentCartridge.hash]
        ),
        showLoadPendingChangesModel: state.guiState.showLoadPendingChangesModal,
        showSelectPendingChangesModel: state.guiState.showSelectPendingChangesModal
    };
}

function mapDispatchToProps(dispatch: Dispatch<State>): HandlerProps {
    return {
        onDelete: () => dispatch(deleteCurrentCartridge()),
        onSave: () => dispatch(saveCurrentCartride()),
        onRun: () => dispatch(runCurrentCartridge()),
        onCartridgeUploaded: file => dispatch(uploadNewCartridge(file)),

        onCartridgeSelected: key => dispatch(selectCartridge(key)),

        onCartridgeNameChange: value => dispatch(changeName(value)),
        onTvModeChanged: mode => dispatch(changeTvMode(mode)),
        onTogglePaddleEmulation: state => dispatch(changePaddleEmulation(state)),
        onToggleAudioEnabled: state => dispatch(toggleAudioEnabled(state)),
        onCartridgeTypeChange: type => dispatch(changeCartridgeType(type)),
        onChangeSeedStrategy: auto => dispatch(changeRngSeedStrategy(auto)),
        onChangeSeedValue: seed => dispatch(changeRngSeed(seed)),

        onSelectPendingChangesClose: () => dispatch(closeSelectPendingChangesModal()),
        onSelectPendingChangesSave: () => dispatch(confirmSelect()),
        onSelectPendingChangesDiscard: () => dispatch(confirmSelect(true)),

        onLoadPendingChangesClose: () => dispatch(closeLoadPendingChangesModal()),
        onLoadPendingChangesSave: () => dispatch(confirmLoad()),
        onLoadPendingChangesDiscard: () => dispatch(confirmLoad(true))
    };
}

const CartridgeManager = connect(mapStateToProps, mapDispatchToProps)(CartridgeManagerComponent);
export default CartridgeManager;
