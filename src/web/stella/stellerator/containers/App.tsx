// tslint:disable-next-line
import * as React from 'react';

import {
    Col,
    Grid,
    Row
} from 'react-bootstrap';

import Navbar from '../components/Navbar';
import CartridgeList from './CartridgeList';
import CartridgeControls from './CartridgeControls';

export default function App() {
    return <div>
        <Navbar/>

        <Grid fluid>
            <Row>
                <Col md={5}>
                    <CartridgeList/>
                </Col>
            </Row>
            <Row>
                <Col sm={5}>
                    <CartridgeControls/>
                </Col>
            </Row>
        </Grid>
    </div>;
}
