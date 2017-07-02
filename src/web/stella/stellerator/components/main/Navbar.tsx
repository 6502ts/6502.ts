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
import {Navbar as BootstrapNavbar} from 'react-bootstrap';

import {default as Header, Props as HeaderProps} from './navbar/Header';
import {default as Navigation, Props as NavigationProps} from './navbar/Navigation';
import {default as StatusWidget, Props as StatusWidgetProps} from './navbar/StatusWidget';

export interface Props extends HeaderProps, NavigationProps, StatusWidgetProps {}

function Navbar(props: Props) {
    return (
        <BootstrapNavbar fixedTop inverse fluid>
            <Header {...props as HeaderProps}/>
            <Navigation {...props as NavigationProps}/>
            <StatusWidget {...props as StatusWidgetProps}/>
        </BootstrapNavbar>
    );
}

export default Navbar;
