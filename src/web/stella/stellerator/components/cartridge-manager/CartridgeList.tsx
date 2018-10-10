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

import * as React from 'react';

import { styled } from '../style';
import Cartridge from '../../model/Cartridge';
import BorderBox from '../general/BorderBox';
import Theme from '../style/Theme';
import { StyledComponentClass } from 'styled-components';

export interface Props {
    cartridges: { [key: string]: Cartridge };
    selectedCartridgeKey: string;
    className?: string;

    onClick?: (key: string) => void;
}

function CartridgeListUnstyled(props: Props) {
    return (
        <BorderBox className={props.className}>
            <ListStyled>
                {Object.keys(props.cartridges)
                    .map(key => props.cartridges[key])
                    .sort((c1: Cartridge, c2: Cartridge) => (c1.name === c2.name ? 0 : c1.name < c2.name ? -1 : 1))
                    .map(cartridge => (
                        <ListItemStyled
                            onClick={() => props.onClick(cartridge.hash)}
                            className={props.selectedCartridgeKey === cartridge.hash ? 'selected' : ''}
                            key={cartridge.hash}
                        >
                            {cartridge.name}
                        </ListItemStyled>
                    ))}
            </ListStyled>
        </BorderBox>
    );
}

namespace CartridgeListUnstyled {
    export const defaultProps: Props = {
        cartridges: {},
        selectedCartridgeKey: '',
        onClick: () => undefined
    };
}

const ListStyled = styled.ul`
    list-style: none;
    padding: 0;
`;

const ListItemStyled = styled.li`
    cursor: pointer;
    list-style: none;
    padding-left: 0.3rem;
    padding-right: 0.3rem;

    &:nth-child(odd) {
        background-color: #444;
    }

    &.selected {
        color: black;
        background: #bbb;
    }
`;

type CartridgeListStyled = StyledComponentClass<Props, Theme>;

const CartridgeListStyled: CartridgeListStyled = styled(CartridgeListUnstyled)`
    height: 24rem;
    overflow-y: auto;
    margin-bottom: 1.5rem;
`;

export { CartridgeListStyled as default };
