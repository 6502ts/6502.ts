import {connect} from 'react-redux';

import State from '../state/State';
import SettingsComponent from '../components/Settings';

import {
    setSmoothScaling,
    setWebGlRendering,
    setGamma
} from '../actions/settings';

function mapStateToProps(state: State): SettingsComponent.Props {
    return {
        smoothScaling: state.settings.smoothScaling,
        webGlRendering: state.settings.webGlRendering,
        gamma: state.settings.gamma
    };
}

const SettingsContainer = connect(mapStateToProps, {
    onToggleSmoothScaling: (value: boolean) => setSmoothScaling(value),
    onToggleWebGlRendering: (value: boolean) => setWebGlRendering(value),
    onChangeGamma: (value: number) => setGamma(value)
})(SettingsComponent);

export default SettingsContainer;
