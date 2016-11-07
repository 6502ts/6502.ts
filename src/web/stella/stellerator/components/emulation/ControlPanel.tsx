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
    Button,
    ControlLabel
} from 'react-bootstrap';

import Switch from '../Switch';
import EmulationServiceInterface from '../../../service/EmulationServiceInterface';

function ControlPanel(props: ControlPanel.Props) {
    return <div style={props.style} className="emulation-control-panel">
        <ControlLabel style={{display: 'block'}}
        >Difficulty left</ControlLabel>
        <Switch
            labelTrue="Amateur / B"
            labelFalse="Pro / A"
            state={props.difficultyPlayer0}
            onSwitch={props.onSwitchDifficultyPlayer0}
        ></Switch>
        <ControlLabel style={{display: 'block', paddingTop: '1rem'}}
        >Difficulty right</ControlLabel>
        <Switch
            labelTrue="Amateur / B"
            labelFalse="Pro / A"
            state={props.difficultyPlayer1}
            onSwitch={props.onSwitchDifficultyPlayer1}
        ></Switch>
        <ControlLabel style={{display: 'block', paddingTop: '1rem'}}
        >TV mode</ControlLabel>
        <Switch
            labelTrue="B/W"
            labelFalse="Color"
            state={props.tvModeSwitch}
            onSwitch={props.onSwitchTvMode}
        ></Switch>
        <ControlLabel style={{display: 'block', paddingTop: '1rem'}}
        >Limit framerate</ControlLabel>
        <Switch
            labelTrue="yes"
            labelFalse="no"
            state={props.enforceRateLimit}
            onSwitch={props.onEnforceRateLimitChange}
        ></Switch>
        <div style={{paddingTop: '2rem'}}>
            <Button
                style={{marginRight: '1rem'}}
                onClick={props.onReset}
            >
                Reset
            </Button>
            <Button
                style={{
                    display: (
                            props.emulationState === EmulationServiceInterface.State.running ||
                            props.emulationState === EmulationServiceInterface.State.paused
                        ) ? 'inline-block' : 'none'
                }}
                onClick={props.emulationState === EmulationServiceInterface.State.running ? props.onPause : props.onResume}
            >
                {props.emulationState === EmulationServiceInterface.State.running ? 'Pause' : 'Resume'}
            </Button>
        </div>
    </div>;
}

module ControlPanel {

    export interface Props {
        difficultyPlayer0?: boolean;
        difficultyPlayer1?: boolean;
        tvModeSwitch?: boolean;
        enforceRateLimit?: boolean;
        emulationState?: EmulationServiceInterface.State;

        style?: {[key: string]: string|number};

        onSwitchDifficultyPlayer0?: (state: boolean) => void;
        onSwitchDifficultyPlayer1?: (state: boolean) => void;
        onSwitchTvMode?: (state: boolean) => void;
        onEnforceRateLimitChange?: (state: boolean) => void;
        onReset?: () => void;
        onPause?: () => void;
        onResume?: () => void;
    }

    export const defaultProps: Props = {
        difficultyPlayer0: true,
        difficultyPlayer1: true,
        tvModeSwitch: false,
        enforceRateLimit: true,
        emulationState: EmulationServiceInterface.State.stopped,

        style: {},

        onSwitchDifficultyPlayer0: () => undefined,
        onSwitchDifficultyPlayer1: () => undefined,
        onSwitchTvMode: () => undefined,
        onEnforceRateLimitChange: () => undefined,
        onReset: () => undefined,
        onPause: () => undefined,
        onResume: () => undefined
    };

}

export default ControlPanel;
