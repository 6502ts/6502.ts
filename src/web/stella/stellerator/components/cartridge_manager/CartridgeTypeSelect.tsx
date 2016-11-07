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


// tslint:disable-next-line
import * as React from 'react';

import CartridgeInfo from '../../../../../machine/stella/cartridge/CartridgeInfo';

import {
    DropdownButton,
    MenuItem
} from 'react-bootstrap';

class CartridgeTypeSelect extends React.Component<CartridgeTypeSelect.Props, CartridgeTypeSelect.State> {

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

    state: CartridgeTypeSelect.State = {
        id: `cartridge_type_select_${Math.floor(Math.random() * 10000000)}`
    };

    static defaultProps: CartridgeTypeSelect.Props = {
        cartridgeType: CartridgeInfo.CartridgeType.unknown,
        onCartridgeTypeChange: (): void => undefined
    };

}

module CartridgeTypeSelect {

    export interface Props {
        cartridgeType?: CartridgeInfo.CartridgeType;
        onCartridgeTypeChange?: (t: CartridgeInfo.CartridgeType) => void;
    }

    export interface State {
        id: string;
    }

}

export default CartridgeTypeSelect;
