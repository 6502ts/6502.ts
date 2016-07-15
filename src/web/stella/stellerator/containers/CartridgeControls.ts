import {connect} from 'react-redux';

import CartridgeControlsComponent from '../components/CartridgeControls';
import {deleteCurrentCartridge} from '../actions/deleteCurrentCartridge';
import State from '../state/State';

function mapStateToProps(state: State): CartridgeControlsComponent.Props {
    return {
        active: !!state.currentCartridge
    };
}

const CartridgeControlsContainer = connect(
    mapStateToProps,
    {
        onDelete: () => deleteCurrentCartridge()
    }
)(CartridgeControlsComponent);

export default CartridgeControlsContainer;
