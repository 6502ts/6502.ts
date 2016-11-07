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

import {
    Navbar as BootstrapNavbar,
    Nav,
    NavItem
} from 'react-bootstrap';

import {
    LinkContainer
} from 'react-router-bootstrap';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

function describeState(state: EmulationServiceInterface.State, frequency: number) {
    switch (state) {
        case EmulationServiceInterface.State.stopped:
            return 'stopped';

        case EmulationServiceInterface.State.running:
            return frequency > 0 ? `running: ${(frequency / 1E6).toFixed(2)} MHz` : 'running';

        case EmulationServiceInterface.State.paused:
            return 'paused';

        case EmulationServiceInterface.State.error:
            return 'emulation error';
    }
}

function Navbar(props: Navbar.Props) {
    return <BootstrapNavbar fixedTop inverse fluid>
        <BootstrapNavbar.Header>
            <BootstrapNavbar.Brand>
                6502.ts Stellerator
            </BootstrapNavbar.Brand>
        </BootstrapNavbar.Header>
        <Nav>
            <LinkContainer to="/cartridge-manager">
                <NavItem>Cartridges</NavItem>
            </LinkContainer>
            <LinkContainer to="/settings">
                <NavItem>Settings</NavItem>
            </LinkContainer>
            <LinkContainer to="/emulation" className={props.linkEmulation ? '' : 'hidden'}>
                <NavItem>Emulation</NavItem>
            </LinkContainer>
            <LinkContainer to="/help">
                <NavItem>Help</NavItem>
            </LinkContainer>
        </Nav>
        <div style={{float: 'right'}}>
            <span className={props.gamepadCount > 0 ? '' : 'hidden'}>
                Gamepads: {props.gamepadCount < 2 ? 'A |' : 'AB |'}
            </span>
            <span style={{marginLeft: '1rem'}}>
                {describeState(props.emulationState, props.frequency)}
            </span>
        </div>
    </BootstrapNavbar>;
}

module Navbar {

    export interface Props {
        linkEmulation?: boolean;
        frequency?: number;
        emulationState?: EmulationServiceInterface.State;
        gamepadCount?: number;
    }

    export const defaultProps: Props = {
        linkEmulation: false,
        frequency: 0,
        emulationState: EmulationServiceInterface.State.stopped,
        gamepadCount: 0
    };

}

export default Navbar;
