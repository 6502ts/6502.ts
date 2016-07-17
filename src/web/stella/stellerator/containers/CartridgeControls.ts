import {connect} from 'react-redux';
import {push} from 'react-router-redux';

import {
    deleteCurrentCartridge,
    guiState
} from '../actions/root';

import {
    setMode
} from '../actions/guiState';

import CartridgeControlsComponent from '../components/CartridgeControls';
import State from '../state/State';
import GuiState from '../state/GuiState';

function mapStateToProps(state: State): CartridgeControlsComponent.Props {
    return {
        active: !!state.currentCartridge
    };
}

// Type inference fails, so we need to drop a hint for the compiler
type Props = CartridgeControlsComponent.Props;
const CartridgeControlsContainer = connect<Props, Props, Props>(
    mapStateToProps,
    dispatch => ({
        onDelete: (): void => void(dispatch(deleteCurrentCartridge())),
        onRun: (): void => {
            // Batching will not work because push is NOT processed by the reducer but
            // intercepted by the middleware instead. Order may be ill defined, but this
            // is of no consequence here.
            dispatch(guiState(setMode(GuiState.GuiMode.run)));
            dispatch(push('/emulation'));
        }
    })
)(CartridgeControlsComponent);

export default CartridgeControlsContainer;
