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
            <LinkContainer to="/emulation" className={props.linkEmulation ? '' : 'hidden'}>
                <NavItem>Emulation</NavItem>
            </LinkContainer>
        </Nav>
        <div style={{float: 'right'}}>
            {describeState(props.emulationState, props.frequency)}
        </div>
    </BootstrapNavbar>;
}

module Navbar {

    export interface Props {
        linkEmulation?: boolean;
        frequency?: number;
        emulationState?: EmulationServiceInterface.State;
    }

    export const defaultProps: Props = {
        linkEmulation: false,
        frequency: 0,
        emulationState: EmulationServiceInterface.State.stopped
    };

}

export default Navbar;
