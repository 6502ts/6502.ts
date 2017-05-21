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

import * as React from 'react';

import {
    Grid,
    Row,
    Col
} from 'react-bootstrap';

import ControlPanel from './emulation/ControlPanel';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';
import EmulationContextInterface from '../../service/EmulationContextInterface';
import DriverManager from '../../service/DriverManager';
import SimpleCanvasVideoDriver from '../../../driver/SimpleCanvasVideo';
import WebglVideoDriver from '../../../driver/webgl/WebglVideo';
import KeyboardIoDriver from '../../driver/KeyboardIO';
import FullscreenVideoDriver from '../../../driver/FullscreenVideo';
import MouseAsPaddleDriver from '../../../driver/MouseAsPaddle';

class Emulation extends React.Component<Emulation.Props, Emulation.State> {

    constructor(props?: Emulation.Props, context?: any) {
        super(props, context);

        this.state = {
            initialPause: true
        };
    }

    componentWillReceiveProps(nextProps: Emulation.Props): void {
        const initialPause =
                this.state.initialPause &&
                nextProps.pausedByUser &&
                nextProps.emulationState === EmulationServiceInterface.State.paused;

        if (initialPause !== this.state.initialPause) {
            this.setState({
                initialPause
            });
        }
    }

    componentWillMount(): void {
        if (!this.props.enabled) {
            return this.props.navigateAway();
        }

        if (
            this.props.emulationState === EmulationServiceInterface.State.paused &&
            !this.props.pausedByUser
        ) {
            this.props.resumeEmulation();
        }
    }

    componentWillUnmount(): void {
        if (this.props.emulationState === EmulationServiceInterface.State.running) {
            this.props.pauseEmulation();
        }

        this._driverManager.unbind();
        this._driverManager = null;

        this._fullscreenDriver.disengage();
    }

    componentDidMount(): void {
        this._driverManager.bind(this.context.emulationService);

        let videoDriver: SimpleCanvasVideoDriver|WebglVideoDriver;

        try {
            if (this.props.webGlRendering) {
                videoDriver = new WebglVideoDriver(this._canvasElt, this.props.gamma);
                videoDriver.init();
            } else {
                videoDriver = new SimpleCanvasVideoDriver(this._canvasElt);
            }

            this._driverManager.addDriver(
                videoDriver,
                (context: EmulationContextInterface, driver: WebglVideoDriver) =>
                    driver.bind(context.getVideo())
            );
        } catch (e) {
            console.log(e);
        }

        const keyboardDriver = new KeyboardIoDriver(document);
        this._fullscreenDriver = new FullscreenVideoDriver(this._canvasElt);

        this._driverManager
            .addDriver(
                new MouseAsPaddleDriver(),
                (context: EmulationContextInterface, driver: MouseAsPaddleDriver) =>
                    driver.bind(context.getPaddle(0))
            )
            .addDriver(
                keyboardDriver,
                (context: EmulationContextInterface, driver: KeyboardIoDriver) =>
                    driver.bind(context.getJoystick(0), context.getJoystick(1), context.getControlPanel())
            );

        keyboardDriver.toggleFullscreen.addHandler(() => this._fullscreenDriver.toggle());

        keyboardDriver.hardReset.addHandler(() => this.props.resetEmulation());

        keyboardDriver.togglePause.addHandler(() => {
            if (this.props.emulationState === EmulationServiceInterface.State.running) {
                this.props.userPauseEmulation();
            }
            else if (this.props.emulationState === EmulationServiceInterface.State.paused) {
                this.props.resumeEmulation();
            }
        });
    }

    render() {
        return <Grid fluid>
            <Row>
                <Col md={11}>
                    wasd / arrows + v/space = left joystick , ijkl + b = right joystick
                    <br/>
                    shift-enter = reset, shift-space = select, enter = toggle fullscreen
                    <br/>
                    shift-r = hard reset, p = pause
                </Col>
            </Row>
            <Row style={{marginTop: '1rem'}}>
                <Col md={6}>
                    <div
                        className={`emulation-viewport error-display ${this._showErrorMessage() ? '' : 'hidden'}`}
                    >
                        {this._errorMessage()}
                    </div>
                    <div
                        className={`emulation-viewport placeholder ${this._showPlaceholder() ? '' : 'hidden'}`}
                    >
                        paused
                    </div>
                    <canvas
                        className={`emulation-viewport ${this._showCanvas() ? '' : 'hidden'}`}
                        width={this.props.initialViewportWidth}
                        height={this.props.initialViewportHeight}
                        style={{imageRendering: this.props.smoothScaling ? 'auto' : 'pixelated'}}
                        ref={(elt) => this._canvasElt = elt as HTMLCanvasElement}
                    ></canvas>
                </Col>
                <Col md={5}>
                    <ControlPanel
                        {...this.props as ControlPanel.Props}
                        onReset={this.props.resetEmulation}
                        onPause={this.props.userPauseEmulation}
                        onResume={this.props.resumeEmulation}
                    ></ControlPanel>
                </Col>
            </Row>
        </Grid>;
    }

    private _showErrorMessage(): boolean {
        return this.props.emulationState === EmulationServiceInterface.State.error;
    }

    private _showPlaceholder(): boolean {
        return this.props.emulationState === EmulationServiceInterface.State.paused && this.state.initialPause;
    }

    private _showCanvas(): boolean {
        return !(this._showErrorMessage() || this._showPlaceholder());
    }

    private _errorMessage(): string {
        const error = this.context.emulationService.getLastError();

        return error && error.message ? error.message : '[unknown]';
    }

    static contextTypes: React.ValidationMap<any> = {
        emulationService: React.PropTypes.object
    };

    context: {
        emulationService: EmulationServiceInterface
    };

    private _driverManager = new DriverManager();
    private _fullscreenDriver: FullscreenVideoDriver = null;
    private _canvasElt: HTMLCanvasElement = null;
}

namespace Emulation {

    export interface Props extends ControlPanel.Props {
        enabled?: boolean;
        initialViewportWidth?: number;
        initialViewportHeight?: number;
        emulationState?: EmulationServiceInterface.State;
        smoothScaling?: boolean;
        webGlRendering?: boolean;
        gamma?: number;
        pausedByUser?: boolean;

        navigateAway?: () => void;
        pauseEmulation?: () => void;
        userPauseEmulation?: () => void;
        resumeEmulation?: () => void;
        resetEmulation?: () => void;
    }

    export const defaultProps: Props = {
        enabled: false,
        initialViewportWidth: 160,
        initialViewportHeight: 192,
        smoothScaling: true,
        webGlRendering: true,
        gamma: 1,
        emulationState: EmulationServiceInterface.State.stopped,
        pausedByUser: false,

        navigateAway: (): void => undefined,
        pauseEmulation: (): void => undefined,
        userPauseEmulation: (): void => undefined,
        resumeEmulation: (): void => undefined,
        resetEmulation: (): void => undefined,

        ...ControlPanel.defaultProps
    };

    export interface State {
        initialPause: boolean;
    }

}

export default Emulation;
