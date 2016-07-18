// tslint:disable-next-line
import * as React from 'react';

import {
    Col,
    Grid,
    Row
} from 'react-bootstrap';

import CartridgeList from './CartridgeList';
import CartridgeControls from './CartridgeControls';
import CartridgeSettings from './CartridgeSettings';
import DiscardChangesModal from './DiscardChangesModal';

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
        <DiscardChangesModal/>
    </Grid>;
}
