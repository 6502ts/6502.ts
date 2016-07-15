import * as React from 'react';

import {
    Nav,
    NavItem
} from 'react-bootstrap';

import Cartridge from '../state/Cartridge';

class CartridgeList extends React.Component<CartridgeList.Props, {}>{

    render() {
        return  <Nav stacked className="cartridge-list border-box">
            {Object.keys(this.props.cartridges).map(
                key => <NavItem href='javascript:void(0)'>
                    {this.props.cartridges[key].name}
                </NavItem>
            )}
        </Nav>;
    }

}

module CartridgeList {

    export interface Props {
        cartridges: {[key: string]: Cartridge};
    }

}

export default CartridgeList;
