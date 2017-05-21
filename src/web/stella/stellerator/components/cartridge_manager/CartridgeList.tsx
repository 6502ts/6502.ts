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

import * as React from 'react';

import Cartridge from '../../state/Cartridge';

function CartridgeList(props: CartridgeList.Props) {
    return  <div className='cartridge-list border-box'>
        <ul>
            {Object
                .keys(props.cartridges)
                .map(key => props.cartridges[key])
                .sort((c1: Cartridge, c2: Cartridge) => c1.name === c2.name ? 0 : ((c1.name < c2.name) ? -1 : 1))
                .map(
                    cartridge =>
                    <li
                        onClick={() => props.onClick(cartridge.hash, props.pendingChanges)}
                        className={props.selectedKey === cartridge.hash ? 'selected' : ''}
                        key={cartridge.hash}
                    >
                        {cartridge.name}
                    </li>
                )
            }
        </ul>
    </div>;
}

namespace CartridgeList {

    export interface Props {
        cartridges?: {[key: string]: Cartridge};
        pendingChanges: boolean;
        selectedKey?: string;

        onClick?: (key: string, pendingChanges: boolean) => void;
    }

    export const defaultProps: Props = {
        cartridges: {},
        selectedKey: '',
        pendingChanges: false,
        onClick: () => undefined
    };

}

export default CartridgeList;
