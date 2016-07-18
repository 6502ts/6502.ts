// tslint:disable-next-line
import * as React from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';

import State from '../state/State';
import GuiState from '../state/GuiState';

interface Props {
    enabled?: boolean;

    navigateAway?: () => void;
}

function mapStateToProps(state: State): Props {
    return {
        enabled: state.guiState.mode === GuiState.GuiMode.run
    };
}

class Emulation extends React.Component<Props, {}> {

    componentWillMount(): void {
        if (!this.props.enabled) {
            this.props.navigateAway();
        }
    }

    render() {
        return <div>Emulation goes here</div>;
    }

    static defaultProps: Props = {
        enabled: false,
        navigateAway: () => undefined
    };

}

const EmulationContainer = connect(mapStateToProps, {
    navigateAway: () => push('/cartridge-manager')
})(Emulation);

export default EmulationContainer;
