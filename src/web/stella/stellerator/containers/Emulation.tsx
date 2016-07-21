// tslint:disable-next-line
import * as React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';

import State from '../state/State';
import GuiState from '../state/GuiState';
import {
    pause as pauseEmulation,
    resume as resumeEmulation
} from '../actions/emulation';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

interface Props {
    enabled?: boolean;

    navigateAway?: () => void;
    pauseEmulation?: () => void;
    resumeEmulation?: () => void;
}

function mapStateToProps(state: State): Props {
    return {
        enabled: state.guiState.mode === GuiState.GuiMode.run
    };
}

class Emulation extends React.Component<Props, {}> {

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
    }

    render() {
        return <div>Emulation goes here</div>;
    }

    context: {
        emulationService: EmulationServiceInterface
    };

    static defaultProps: Props = {
        enabled: false,
        navigateAway: () => undefined
    };

    static contextTypes: React.ValidationMap<any> = {
        emulationService: React.PropTypes.object
    };
}

const EmulationContainer = connect(mapStateToProps, {
    navigateAway: () => push('/cartridge-manager'),
    pauseEmulation,
    resumeEmulation
})(Emulation);

export default EmulationContainer;
