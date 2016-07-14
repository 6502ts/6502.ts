import {connect} from 'react-redux';

import CartridgeListComponent from '../components/CartridgeList';
import State from '../state/State';

function mapStateToProps(state: State): CartridgeListComponent.Props {
    return {
        cartridges: state.cartridges
    };
}

const CartridgeListContainer = connect(
    mapStateToProps,
    {}
)(CartridgeListComponent);

export default CartridgeListContainer;
