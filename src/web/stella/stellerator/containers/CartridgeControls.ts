import {connect} from 'react-redux';
import {push} from 'react-router-redux';

import {
    batch,
    deleteCurrentCartridge,
    saveCurrentCartride
} from '../actions/root';
import {setMode} from '../actions/guiState';

import CartridgeControlsComponent from '../components/CartridgeControls';
import State from '../state/State';
import GuiState from '../state/GuiState';

function mapStateToProps(state: State): CartridgeControlsComponent.Props {
    return {
        active: !!state.currentCartridge,
        changes: state.currentCartridge &&
            !state.currentCartridge.equals(state.cartridges[state.currentCartridge.hash])
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
            // intercepted by the middleware instead.
            dispatch(
                batch(
                    saveCurrentCartride(),
                    setMode(GuiState.GuiMode.run)
                )
            );
            dispatch(push('/emulation'));
        },
        onSave: (): void => void(dispatch(saveCurrentCartride()))
    })
)(CartridgeControlsComponent);

export default CartridgeControlsContainer;
