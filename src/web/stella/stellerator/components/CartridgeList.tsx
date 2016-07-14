import * as React from 'react';

import {
    Nav,
    NavItem
} from 'react-bootstrap';

import Cartridge from '../state/Cartridge';

class CartridgeList extends React.Component<CartridgeList.Props, {}>{

    render() {
        return  <Nav stacked className="cartridge-list border-box">
            {this.props.cartridges.map(
                (cartridge: Cartridge) => <NavItem href='javascript:void(0)'>{cartridge.name}</NavItem>
            )}
        </Nav>;
    }

}

module CartridgeList {

    export interface Props {
        cartridges: Array<Cartridge>;
    }

}

export default CartridgeList;
