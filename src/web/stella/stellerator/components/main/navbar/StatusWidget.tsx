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
import { styled } from '../../style';

import { default as GamepadStatus, Props as GamepadStatusProps } from './GamepadStatus';
import { default as EmulationStatus, Props as EmulationStatusProps } from './EmulationStatus';
import { StyledComponentClass } from 'styled-components';
import Theme from '../../style/Theme';

export interface Props extends GamepadStatusProps, EmulationStatusProps {
    className?: string;
}

export function StatusWidgetUnstyled(props: Props) {
    return (
        <div className={props.className}>
            <EmulationStatus {...props as EmulationStatusProps} />
            <GamepadStatus {...props as GamepadStatusProps} />
        </div>
    );
}

type StatusWidgetStyled = StyledComponentClass<Props, Theme>;

const StatusWidgetStyled: StatusWidgetStyled = styled(StatusWidgetUnstyled)`
    float: right;
`;

export { StatusWidgetStyled as default };
