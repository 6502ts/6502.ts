import {connect} from 'react-redux';

import {
    changeName,
    changeTvMode
} from '../actions/currentCartridge';

import {saveCurrentCartride} from '../actions/root';
import CartridgeSettingsComponent from '../components/CartridgeSettings';
import State from '../state/State';

import StellaConfig from '../../../../machine/stella/Config';

function mapStateToProps(state: State): CartridgeSettingsComponent.Props {
    return {
        name: state.currentCartridge ? state.currentCartridge.name : '',
        tvMode: state.currentCartridge ? state.currentCartridge.tvMode : StellaConfig.TvMode.ntsc,
        visible: !!state.currentCartridge
    };
}

const CartridgeSettingsContainer = connect(
    mapStateToProps, {
        onNameChange: (value: string) => changeName(value),
        onKeyEnter: () => saveCurrentCartride(),
        onTvModeChange: (tvMode: StellaConfig.TvMode) => changeTvMode(tvMode)
    }
)(CartridgeSettingsComponent);
export default CartridgeSettingsContainer;
