// tslint:disable-next-line
import * as React from 'react';

import {
    Grid,
    Row,
    Col
} from 'react-bootstrap';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';
import EmulationContextInterface from '../../service/EmulationContextInterface';
import DriverManager from '../../service/DriverManager';
import SimpleCanvasVideoDriver from '../../../driver/SimpleCanvasVideo';

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
    }

    componentDidMount(): void {
        this._driverManager.bind(this.context.emulationService);
        this._driverManager.addDriver(
            new SimpleCanvasVideoDriver(this._canvasElt),
            (context: EmulationContextInterface, driver: SimpleCanvasVideoDriver) => driver.bind(context.getVideo())
        );
    }

    render() {
        return<Grid fluid>
            <Row>
                <Col md={6} mdPush={3}>
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
            </Row>
        </Grid>;
    }

    context: {
        emulationService: EmulationServiceInterface
    };

    static defaultProps: Emulation.Props = {
        enabled: false,
        initialViewportWidth: 160,
        initialViewportHeight: 192,
        emulationState: EmulationServiceInterface.State.stopped,

        navigateAway: (): void => undefined,
        pauseEmulation: (): void => undefined,
        resumeEmulation: (): void => undefined
    };

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
    private _canvasElt: HTMLCanvasElement = null;
}

module Emulation {

    export interface Props {
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
