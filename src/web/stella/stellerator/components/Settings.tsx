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
    return <Grid fluid className="settings-grid">
        <Row>
            <Col md={12}>
                <h1>Display Settings</h1>
            </Col>
        </Row>
        <Row>
            <Col sm={4}>
                <ControlLabel>Smooth Scaling:</ControlLabel>
            </Col>
            <Col sm={8}>
                <Switch
                    labelTrue="On"
                    labelFalse="Off"
                    state={props.smoothScaling}
                    onSwitch={props.onToggleSmoothScaling}
                />
            </Col>
        </Row>
        <Row>
            <Col sm={4}>
                <ControlLabel>WebGL Rendering:</ControlLabel>
            </Col>
            <Col sm={8}>
                <Switch
                    labelTrue="On"
                    labelFalse="Off"
                    state={props.webGlRendering}
                    onSwitch={props.onToggleWebGlRendering}
                />
            </Col>
        </Row>
        <Row>
            <Col sm={4}>
                <ControlLabel>Gamma Correction (WebGL only):</ControlLabel>
            </Col>
            <Col sm={4}>
                <input
                    type="range"
                    value={props.gamma}
                    min="0.1"
                    max="5"
                    step="0.1"
                    onChange={e => props.onChangeGamma(parseFloat((e.target as HTMLInputElement).value))}
                />
            </Col>
            <Col sm={1} style={{paddingLeft: '1rem'}}>
                {props.gamma}
            </Col>
        </Row>
    </Grid>;
}

module Settings {

    export interface Props {
        smoothScaling?: boolean;
        webGlRendering?: boolean;
        gamma?: number;

        onToggleSmoothScaling?: (value: boolean) => void;
        onToggleWebGlRendering?: (value: boolean) => void;
        onChangeGamma?: (value: number) => void;
    }

    export const defaultProps: Props = {
        smoothScaling: true,
        webGlRendering: true,
        gamma: 1,

        onToggleSmoothScaling: () => undefined,
        onToggleWebGlRendering: () => undefined,
        onChangeGamma: () => undefined
    };

}

export default Settings;
