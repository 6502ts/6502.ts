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

import EmulationComponent from '../components/Emulation';

function mapStateToProps(state: State): EmulationComponent.Props {
    return {
        enabled: state.guiState.mode === GuiState.GuiMode.run,
        emulationState: state.emulationState.emulationState
    };
}

const EmulationContainer = connect(mapStateToProps, {
    navigateAway: () => push('/cartridge-manager'),
    pauseEmulation,
    resumeEmulation
})(EmulationComponent);

export default EmulationContainer;
