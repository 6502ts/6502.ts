// tslint:disable-next-line
import * as React from 'react';

import {
    Col,
    Grid,
    Nav,
    NavItem,
    Row
} from 'react-bootstrap';

import Navbar from './Navbar';

export default function App() {
    return <div>
        <Navbar/>

        <Grid fluid>
            <Row>
                <Col md={6}>
                    <Nav stacked>
                        <NavItem href="#">Foo</NavItem>
                        <NavItem href="#">Bar</NavItem>
                    </Nav>
                </Col>
            </Row>
        </Grid>
    </div>;
}
