import {connect} from 'react-redux';

import CartridgeListComponent from '../components/CartridgeList';
import {selectCartridge} from '../actions/selectCartridge';
import State from '../state/State';

function mapStateToProps(state: State): CartridgeListComponent.Props {
    return {
        cartridges: state.cartridges,
        selectedKey: state.currentCartridge ? state.currentCartridge.hash : ''
    };
}

const CartridgeListContainer = connect(
    mapStateToProps,
    {
        onClick: (hash: string) => selectCartridge(hash)
    }
)(CartridgeListComponent);

export default CartridgeListContainer;
