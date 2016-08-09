import {connect} from 'react-redux';

import State from '../state/State';
import SettingsComponent from '../components/Settings';

import {
    setSmoothScaling,
    setWebGlRendering,
    setGamma,
    setUseWorker
} from '../actions/settings';

function mapStateToProps(state: State): SettingsComponent.Props {
    return {
        smoothScaling: state.settings.smoothScaling,
        webGlRendering: state.settings.webGlRendering,
        gamma: state.settings.gamma,
        useWorker: state.settings.useWorker
    };
}

const SettingsContainer = connect(mapStateToProps, {
    onToggleSmoothScaling: (value: boolean) => setSmoothScaling(value),
    onToggleWebGlRendering: (value: boolean) => setWebGlRendering(value),
    onChangeGamma: (value: number) => setGamma(value),
    onToggleUseWorker: (value: boolean) => setUseWorker(value)
})(SettingsComponent);

export default SettingsContainer;
