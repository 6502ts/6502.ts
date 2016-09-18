import {connect} from 'react-redux';

import CartridgeListComponent from '../../components/cartridge_manager/CartridgeList';
import {selectCartridge} from '../../actions/root';
import {selectOpenPendingChangesModal} from '../../actions/guiState';
import State from '../../state/State';

function mapStateToProps(state: State): CartridgeListComponent.Props {
    return {
        cartridges: state.cartridges,
        selectedKey: state.currentCartridge ? state.currentCartridge.hash : '',
        pendingChanges: !!state.currentCartridge &&
            !state.currentCartridge.equals(state.cartridges[state.currentCartridge.hash])
    };
}

const CartridgeListContainer = connect(
    mapStateToProps,
    {
        onClick: (hash: string, pendingChanges: boolean) =>
            pendingChanges ? selectOpenPendingChangesModal(hash) : selectCartridge(hash)
    }
)(CartridgeListComponent);

export default CartridgeListContainer;
