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

import CartridgeList from './CartridgeList';
import CartridgeControls from './CartridgeControls';
import CartridgeSettings from './CartridgeSettings';

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
