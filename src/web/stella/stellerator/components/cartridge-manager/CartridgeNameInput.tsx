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
import {FormControl} from 'react-bootstrap';

function CartridgeNameInput(props: CartridgeNameInput.Props) {
    return <FormControl
        type='text'
        value={props.name}
        onChange={(e: React.FormEvent<any>) => props.onNameChange((e.target as HTMLInputElement).value)}
        onKeyDown={(e: React.KeyboardEvent<any>) => e.keyCode === 13 ? props.onKeyEnter() : undefined}
    />;
}

namespace CartridgeNameInput {

    export interface Props {
        name: string;
        onNameChange?: (value: string) => void;
        onKeyEnter?: () => void;
    }

    export const defaultProps: Props = {
        name : '',
        onNameChange: () => undefined,
        onKeyEnter: () => undefined,
    };

}

export default CartridgeNameInput;
