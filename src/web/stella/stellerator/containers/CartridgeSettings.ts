import {connect} from 'react-redux';

import {changeName} from '../actions/currentCartridge';
import {currentCartridge} from '../actions/root';
import CartridgeSettingsComponent from '../components/CartridgeSettings';
import State from '../state/State';

function mapStateToProps(state: State): CartridgeSettingsComponent.Props {
    return {
        name: state.currentCartridge ? state.currentCartridge.name : '',
        visible: !!state.currentCartridge
    };
}

const CartridgeSettingsContainer = connect(
    mapStateToProps, {
        onNameChange: (value: string) => currentCartridge(changeName(value))
    }
)(CartridgeSettingsComponent);
export default CartridgeSettingsContainer;
