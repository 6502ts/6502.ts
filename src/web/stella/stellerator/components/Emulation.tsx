// tslint:disable-next-line
import * as React from 'react';

import {
    Grid,
    Row,
    Col
} from 'react-bootstrap';

import ControlPanel from './ControlPanel';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';
import EmulationContextInterface from '../../service/EmulationContextInterface';
import DriverManager from '../../service/DriverManager';
import SimpleCanvasVideoDriver from '../../../driver/SimpleCanvasVideo';
import KeyboardIoDriver from '../../driver/KeyboardIO';
import FullscreenVideoDriver from '../../../driver/FullscreenVideo';
import MouseAsPaddleDriver from '../../../driver/MouseAsPaddle';

class Emulation extends React.Component<Emulation.Props, {}> {

    componentWillMount(): void {
        if (!this.props.enabled) {
            return this.props.navigateAway();
        }

        if (this.context.emulationService.getState() === EmulationServiceInterface.State.paused) {
            this.props.resumeEmulation();
        }
    }

    componentWillUnmount(): void {
        if (this.context.emulationService.getState() === EmulationServiceInterface.State.running) {
            this.props.pauseEmulation();
        }

        this._driverManager.unbind();
        this._driverManager = null;

        this._fullscreenDriver.disengage();
    }

    componentDidMount(): void {
        this._driverManager.bind(this.context.emulationService);

        const keyboardDriver = new KeyboardIoDriver(document);
        this._fullscreenDriver = new FullscreenVideoDriver(this._canvasElt);

        this._driverManager
            .addDriver(
                new SimpleCanvasVideoDriver(this._canvasElt),
                (context: EmulationContextInterface, driver: SimpleCanvasVideoDriver) =>
                    driver.bind(context.getVideo())
            )
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
    }

    render() {
        return <Grid fluid>
            <Row>
                <Col md={11}>
                    wasd / arrows + v/space = left joystick , ijkl + b = right joystick
                    <br/>
                    left ctrl = select, alt = reset, enter = toggle fullscreen
                </Col>
            </Row>
            <Row style={{marginTop: '1rem'}}>
                <Col md={6}>
                    <div
                        className={`emulation-viewport error-display ${this._emulationError() ? '' : 'hidden'}`}
                    >
                        {this._errorMessage()}
                    </div>
                    <canvas
                        className={`emulation-viewport ${this._emulationError() ? 'hidden' : ''}`}
                        width={this.props.initialViewportWidth}
                        height={this.props.initialViewportHeight}
                        ref={(elt) => this._canvasElt = elt as HTMLCanvasElement}
                    ></canvas>
                </Col>
                <Col md={5}>
                    <ControlPanel {...this.props}></ControlPanel>
                </Col>
            </Row>
        </Grid>;
    }

    context: {
        emulationService: EmulationServiceInterface
    };

    static defaultProps: Emulation.Props = Object.assign({
        enabled: false,
        initialViewportWidth: 160,
        initialViewportHeight: 192,
        emulationState: EmulationServiceInterface.State.stopped,

        navigateAway: (): void => undefined,
        pauseEmulation: (): void => undefined,
        resumeEmulation: (): void => undefined
    }, ControlPanel.defaultProps);

    static contextTypes: React.ValidationMap<any> = {
        emulationService: React.PropTypes.object
    };

    private _emulationError(): boolean {
        return this.context.emulationService.getState() === EmulationServiceInterface.State.error;
    }

    private _errorMessage(): string {
        const error = this.context.emulationService.getLastError();

        return error && error.message ? error.message : '[unknown]';
    }

    private _driverManager = new DriverManager();
    private _fullscreenDriver: FullscreenVideoDriver = null;
    private _canvasElt: HTMLCanvasElement = null;
}

module Emulation {

    export interface Props extends ControlPanel.Props {
        enabled?: boolean;
        initialViewportWidth?: number;
        initialViewportHeight?: number;
        emulationState?: EmulationServiceInterface.State;

        navigateAway?: () => void;
        pauseEmulation?: () => void;
        resumeEmulation?: () => void;
    }

}

export default Emulation;
