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
    Col,
    Grid,
    Row
} from 'react-bootstrap';

import {
    LoadPendingChangesModal,
    SelectPendingChangesModal
} from './pendingChangesModal';

import CartridgeList from './cartridge_manager/CartridgeList';
import CartridgeControls from './cartridge_manager/CartridgeControls';
import CartridgeSettings from './cartridge_manager/CartridgeSettings';

export default function CartridgeManager() {
    return <Grid fluid>
        <Row>
            <Col md={5}>
                <CartridgeList/>
            </Col>
            <Col md={5} mdOffset={1}>
                <CartridgeSettings/>
            </Col>
        </Row>
        <Row>
            <Col sm={5}>
                <CartridgeControls/>
            </Col>
        </Row>
        <SelectPendingChangesModal>
            <p>
                There are unsaved changes in the currently selected cartridge.
                Selecting another cartridge will discard these changes.
            </p>
            <p>
                Do you want to continue?
            </p>
        </SelectPendingChangesModal>
        <LoadPendingChangesModal>
            <p>
                There are unsaved changes in the currently selected cartridge.
                Loading a cartridge will discard these changes.
            </p>
            <p>
                Do you want to continue?
            </p>
        </LoadPendingChangesModal>
    </Grid>;
}
