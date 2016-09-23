// tslint:disable-next-line
import * as React from 'react';

import{
    Col,
    Grid,
    Row
} from 'react-bootstrap';

import Markdown from './Markdown';

function Help(props: Help.Props) {
    return <Grid fluid>
        <Row>
            <Col md={12}>
                <Markdown url={props.helppageUrl}/>
            </Col>
        </Row>
    </Grid>;
}

module Help {

    export interface Props {
        helppageUrl: string;
    }

    export const defaultProps: Props = {
        helppageUrl: ''
    };

}

export default Help;