// tslint:disable-next-line
import * as React from 'react';

import {ControlLabel} from 'react-bootstrap';

import Switch from '../Switch';

function ControlPanel(props: ControlPanel.Props) {
    return <div style={props.style} className="emulation-control-panel">
        <ControlLabel style={{display: 'block'}}
        >Difficulty Left</ControlLabel>
        <Switch
            labelTrue="Amateur / B"
            labelFalse="Pro / A"
            state={props.difficultyPlayer0}
            onSwitch={props.onSwitchDifficultyPlayer0}
        ></Switch>
        <ControlLabel style={{display: 'block', paddingTop: '1rem'}}
        >Difficulty Right</ControlLabel>
        <Switch
            labelTrue="Amateur / B"
            labelFalse="Pro / A"
            state={props.difficultyPlayer1}
            onSwitch={props.onSwitchDifficultyPlayer1}
        ></Switch>
        <ControlLabel style={{display: 'block', paddingTop: '1rem'}}
        >TV Mode</ControlLabel>
        <Switch
            labelTrue="B/W"
            labelFalse="Color"
            state={props.tvModeSwitch}
            onSwitch={props.onSwitchTvMode}
        ></Switch>
        <ControlLabel style={{display: 'block', paddingTop: '1rem'}}
        >Limit frame rate</ControlLabel>
        <Switch
            labelTrue="yes"
            labelFalse="no"
            state={props.enforceRateLimit}
            onSwitch={props.onEnforceRateLimitChange}
        ></Switch>
    </div>;
}

module ControlPanel {

    export interface Props {
        difficultyPlayer0?: boolean;
        difficultyPlayer1?: boolean;
        tvModeSwitch?: boolean;
        enforceRateLimit?: boolean;

        style?: {[key: string]: string|number};

        onSwitchDifficultyPlayer0?: (state: boolean) => void;
        onSwitchDifficultyPlayer1?: (state: boolean) => void;
        onSwitchTvMode?: (state: boolean) => void;
        onEnforceRateLimitChange?: (state: boolean) => void;
    }

    export const defaultProps: Props = {
        difficultyPlayer0: true,
        difficultyPlayer1: true,
        tvModeSwitch: false,
        enforceRateLimit: true,

        style: {},

        onSwitchDifficultyPlayer0: () => undefined,
        onSwitchDifficultyPlayer1: () => undefined,
        onSwitchTvMode: () => undefined,
        onEnforceRateLimitChange: () => undefined
    };

}

export default ControlPanel;
