// tslint:disable-next-line
import * as React from 'react';

import{
    Col,
    ControlLabel,
    Grid,
    Row
} from 'react-bootstrap';

import Switch from './Switch';

function Settings(props: Settings.Props) {
    return <Grid fluid>
        <Row>
            <Col md={12}>
                <h1>Display Settings</h1>
            </Col>
            <Col md={12}>
                <ControlLabel style={{marginRight: '1rem'}}>
                    Smooth Scaling:
                </ControlLabel>
                <Switch
                    labelTrue="On"
                    labelFalse="Off"
                    state={props.smoothScaling}
                    onSwitch={props.onToggleSmoothScaling}
                />
            </Col>
        </Row>
    </Grid>;
}

module Settings {

    export interface Props {
        smoothScaling?: boolean;

        onToggleSmoothScaling?: (value: boolean) => void;
    }

    export const defaultProps: Props = {
        smoothScaling: true,
        onToggleSmoothScaling: () => undefined
    };

}

export default Settings;
