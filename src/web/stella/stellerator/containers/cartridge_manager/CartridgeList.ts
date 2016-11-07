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

import CartridgeListComponent from '../../components/cartridge_manager/CartridgeList';
import {selectCartridge} from '../../actions/root';
import {selectOpenPendingChangesModal} from '../../actions/guiState';
import State from '../../state/State';

function mapStateToProps(state: State): CartridgeListComponent.Props {
    return {
        cartridges: state.cartridges,
        selectedKey: state.currentCartridge ? state.currentCartridge.hash : '',
        pendingChanges: !!state.currentCartridge &&
            !state.currentCartridge.equals(state.cartridges[state.currentCartridge.hash])
    };
}

const CartridgeListContainer = connect(
    mapStateToProps,
    {
        onClick: (hash: string, pendingChanges: boolean) =>
            pendingChanges ? selectOpenPendingChangesModal(hash) : selectCartridge(hash)
    }
)(CartridgeListComponent);

export default CartridgeListContainer;
