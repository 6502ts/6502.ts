import {connect} from 'react-redux';

import State from '../state/State';
import SettingsComponent from '../components/Settings';

import {
    setSmoothScaling
} from '../actions/settings';

function mapStateToProps(state: State): SettingsComponent.Props {
    return {
        smoothScaling: state.settings.smoothScaling
    };
}

const SettingsContainer = connect(mapStateToProps, {
    onToggleSmoothScaling: (value: boolean) => setSmoothScaling(value)
})(SettingsComponent);

export default SettingsContainer;
