/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import * as React from 'react';

import { Col, ControlLabel, Grid, Row } from 'react-bootstrap';
import * as bowser from 'bowser';

import Slider from './general/Slider';
import Switch from './general/Switch';
import AudioDriverSelect from './settings/AudioDriverSelect';
import SettingsModel from '../model/Settings';
import CpuAccuracySelect from './settings/CpuAccuracySelect';

const isSafari = bowser.safari || bowser.ios;

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
                    <Switch labelTrue="Yes" labelFalse="No" state={props.useWorker} onSwitch={props.onToggleUseWorker} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Default CPU emulation accuracy (requires cartridge restart):</ControlLabel>
                </Col>
                <Col sm={8}>
                    <CpuAccuracySelect cpuAccuracy={props.cpuAccuracy} onCpuAccuracyChange={props.onChangeDefaultCpuAccuracy} />
                </Col>
            </Row>
            <Row style={{ marginTop: '1rem' }}>
                <Col md={12}>
                    <h1>Audio Settings</h1>
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Volume:</ControlLabel>
                </Col>
                <Col sm={4}>
                    <Slider value={props.volume} min={0} max={1} step={0.01} onChange={props.onChangeVolume} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Default Audio Driver:</ControlLabel>
                </Col>
                <Col sm={8}>
                    <AudioDriverSelect driver={props.audioDriver} onDriverChange={props.onChangeAudioDriver} />
                </Col>
            </Row>
            <Row style={{ marginTop: '1rem' }}>
                <Col md={12}>
                    <h1>Display Settings</h1>
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Smooth scaling:</ControlLabel>
                </Col>
                <Col sm={8}>
                    <Switch labelTrue="On" labelFalse="Off" state={props.smoothScaling} onSwitch={props.onToggleSmoothScaling} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>WebGL rendering:</ControlLabel>
                </Col>
                <Col sm={8}>
                    <Switch labelTrue="On" labelFalse="Off" state={props.webGlRendering} onSwitch={props.onToggleWebGlRendering} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>POV / Phosphor emulation (WebGL only):</ControlLabel>
                </Col>
                <Col sm={8}>
                    <Switch labelTrue="On" labelFalse="Off" state={props.povEmulation} onSwitch={props.onTogglePovEmulation} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Gamma correction (WebGL only):</ControlLabel>
                </Col>
                <Col sm={4}>
                    <Slider value={props.gamma} min={0.1} max={5} step={0.1} onChange={props.onChangeGamma} />
                </Col>
            </Row>
            {isSafari ? null : <Row>
                    <Col sm={4}>
                        <ControlLabel>Reduce framerate (requires cartridge restart):</ControlLabel>
                    </Col>
                    <Col sm={8}>
                        <Switch labelTrue="On" labelFalse="Off" state={props.mergeFrames} onSwitch={props.onToggleMergeFrames} />
                    </Col>
                </Row>}
            <Row>
                <Col sm={4}>
                    <ControlLabel>Sync rendering to browser redraw:</ControlLabel>
                </Col>
                <Col sm={8}>
                    <Switch labelTrue="On" labelFalse="Off" state={props.syncRendering} onSwitch={props.onChangeSyncRendering} />
                </Col>
            </Row>
            <Row style={{ marginTop: '1rem' }}>
                <Col md={12}>
                    <h1>Touch controls</h1>
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Enable touch controls:</ControlLabel>
                </Col>
                <Col sm={8}>
                    <Switch labelTrue="On" labelFalse="Off" state={props.enableTouchControls} onSwitch={props.onChangeEnableTouch} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Left handed mode:</ControlLabel>
                </Col>
                <Col sm={8}>
                    <Switch labelTrue="On" labelFalse="Off" state={props.touchLeftHandedMode} onSwitch={props.onChangeTouchLeftHandedMode} />
                </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <ControlLabel>Virtual joystick sensitivity:</ControlLabel>
                </Col>
                <Col sm={4}>
                    <Slider
                        value={props.touchJoystickSensitivity}
                        min={0}
                        max={100}
                        step={1}
                        onChange={props.onChangeTouchJoystickSensitivity}
                        format={x => x}
                    />
                </Col>
            </Row>
        </Grid>;
}

namespace Settings {
    export interface Props {
        smoothScaling?: boolean;
        webGlRendering?: boolean;
        povEmulation?: boolean;
        gamma?: number;
        useWorker?: boolean;
        mergeFrames?: boolean;
        volume?: number;
        syncRendering?: boolean;
        audioDriver?: SettingsModel.AudioDriver;
        cpuAccuracy?: SettingsModel.CpuAccuracy;
        enableTouchControls?: boolean;
        touchJoystickSensitivity?: number;
        touchLeftHandedMode?: boolean;

        onToggleSmoothScaling?: (value: boolean) => void;
        onToggleWebGlRendering?: (value: boolean) => void;
        onTogglePovEmulation?: (value: boolean) => void;
        onChangeGamma?: (value: number) => void;
        onToggleUseWorker?: (value: boolean) => void;
        onToggleMergeFrames?: (value: boolean) => void;
        onChangeVolume?: (value: number) => void;
        onChangeSyncRendering?: (value: boolean) => void;
        onChangeAudioDriver?: (newDriver: SettingsModel.AudioDriver) => void;
        onChangeDefaultCpuAccuracy?: (newAccuracy: SettingsModel.CpuAccuracy) => void;
        onChangeEnableTouch?: (value: boolean) => void;
        onChangeTouchJoystickSensitivity?: (value: number) => void;
        onChangeTouchLeftHandedMode?: (value: boolean) => void;
    }

    export const defaultProps: Props = {
        smoothScaling: true,
        webGlRendering: true,
        povEmulation: true,
        gamma: 1,
        useWorker: false,
        mergeFrames: false,
        volume: 1,
        syncRendering: true,
        audioDriver: SettingsModel.AudioDriver.pcm,
        cpuAccuracy: SettingsModel.CpuAccuracy.cycle,
        enableTouchControls: true,
        touchJoystickSensitivity: 15,
        touchLeftHandedMode: false,

        onToggleSmoothScaling: () => undefined,
        onToggleWebGlRendering: () => undefined,
        onChangeGamma: () => undefined,
        onToggleUseWorker: () => undefined,
        onToggleMergeFrames: () => undefined,
        onChangeVolume: () => undefined,
        onChangeSyncRendering: () => undefined,
        onChangeAudioDriver: () => undefined,
        onChangeDefaultCpuAccuracy: () => undefined,
        onChangeEnableTouch: () => undefined,
        onChangeTouchJoystickSensitivity: () => undefined,
        onChangeTouchLeftHandedMode: () => undefined
    };
}

export { Settings as default };
