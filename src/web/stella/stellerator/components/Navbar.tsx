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
    </BootstrapNavbar>;
}

module Navbar {

    export interface Props {
        linkEmulation?: boolean;
    }

}

export default Navbar;
