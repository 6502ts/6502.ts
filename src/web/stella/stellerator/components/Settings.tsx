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
                <h1>General Settings</h1>
            </Col>
        </Row>
        <Row>
            <Col sm={4}>
                <ControlLabel>Use worker (requires reload):</ControlLabel>
            </Col>
            <Col sm={8}>
                <Switch
                    labelTrue="Yes"
                    labelFalse="No"
                    state={props.useWorker}
                    onSwitch={props.onToggleUseWorker}
                />
            </Col>
        </Row>
        <Row style={{marginTop: '1rem'}}>
            <Col md={12}>
                <h1>Display Settings</h1>
            </Col>
        </Row>
        <Row>
            <Col sm={4}>
                <ControlLabel>Smooth scaling:</ControlLabel>
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
                <ControlLabel>WebGL rendering:</ControlLabel>
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
                <ControlLabel>Gamma correction (WebGL only):</ControlLabel>
            </Col>
            <Col sm={4}>
                <input
                    type="range"
                    value={props.gamma + ''}
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
        useWorker?: boolean;

        onToggleSmoothScaling?: (value: boolean) => void;
        onToggleWebGlRendering?: (value: boolean) => void;
        onChangeGamma?: (value: number) => void;
        onToggleUseWorker?: (value: boolean) => void;
    }

    export const defaultProps: Props = {
        smoothScaling: true,
        webGlRendering: true,
        gamma: 1,
        useWorker: false,

        onToggleSmoothScaling: () => undefined,
        onToggleWebGlRendering: () => undefined,
        onChangeGamma: () => undefined,
        onToggleUseWorker: () => undefined
    };

}

export default Settings;
