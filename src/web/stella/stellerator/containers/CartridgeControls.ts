import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import {Action} from 'redux';

import {
    deleteCurrentCartridge,
    registerNewCartridge,
    saveCurrentCartride
} from '../actions/root';

import {
    start as startEmulation
} from '../actions/emulation';

import {
    loadOpenPendingChangesModal,
    setMode,
} from '../actions/guiState';

import CartridgeControlsComponent from '../components/CartridgeControls';
import State from '../state/State';
import GuiState from '../state/GuiState';

function mapStateToProps(state: State): CartridgeControlsComponent.Props {
    return {
        active: !!state.currentCartridge,
        changes: !!state.currentCartridge &&
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
            // Batching will not work because push and startEmulation are processed by middleware
            dispatch(saveCurrentCartride());
            dispatch(setMode(GuiState.GuiMode.run));
            dispatch(startEmulation());
            dispatch(push('/emulation'));
        },
        onSave: (): void => void(dispatch(saveCurrentCartride())),
        onCartridgeUploaded: (file, changes) => dispatch(
            (dispatch: (a: Action) => void) => {
                const reader = new FileReader();

                reader.addEventListener('load', () => {
                    dispatch(changes ?
                        loadOpenPendingChangesModal(reader.result, file.name) :
                        registerNewCartridge(file.name, new Uint8Array(reader.result))
                    );
                });

                reader.readAsArrayBuffer(file);
            }
        )
    })
)(CartridgeControlsComponent);

export default CartridgeControlsContainer;
