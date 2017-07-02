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

import * as React from 'react';

import CartridgeInfo from '../../../../../machine/stella/cartridge/CartridgeInfo';

import {
    DropdownButton,
    MenuItem
} from 'react-bootstrap';
export interface State {
    id: string;
}

class CartridgeTypeSelect extends React.Component<CartridgeTypeSelect.Props, State> {

    render() {
        return <DropdownButton
            id={this.state.id}
            title={CartridgeInfo.describeCartridgeType(this.props.cartridgeType)}
            onSelect={this.props.onCartridgeTypeChange as any}
        >
            {CartridgeInfo.getAllTypes().map(cartridgeType =>
                <MenuItem
                    eventKey={cartridgeType}
                    active={cartridgeType === this.props.cartridgeType}
                    key={cartridgeType}
                >
                    {CartridgeInfo.describeCartridgeType(cartridgeType)}
                </MenuItem>
            )}
        </DropdownButton>;
    }

    state: State = {
        id: `cartridge_type_select_${Math.floor(Math.random() * 10000000)}`
    };

}

namespace CartridgeTypeSelect {

    export interface Props {
        cartridgeType?: CartridgeInfo.CartridgeType;
        onCartridgeTypeChange?: (t: CartridgeInfo.CartridgeType) => void;
    }

    export const defaultProps: Props = {
        cartridgeType: CartridgeInfo.CartridgeType.unknown,
        onCartridgeTypeChange: (): void => undefined
    };

}

export default CartridgeTypeSelect;
