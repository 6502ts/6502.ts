import * as React from 'react';

import Cartridge from '../state/Cartridge';

class CartridgeList extends React.Component<CartridgeList.Props, {}>{

    render() {
        return  <div className="cartridge-list border-box">
            <ul>
                {Object.keys(this.props.cartridges).map(
                    key =>
                    <li
                        onClick={() => this.props.onClick(key)}
                        className={this.props.selectedKey === key ? 'selected' : ''}
                    >
                        {this.props.cartridges[key].name}
                    </li>
                )}
            </ul>
        </div>;
    }

    static defaultProps: CartridgeList.Props = {
        cartridges: {},
        selectedKey: '',
        onClick: () => undefined
    };

}

module CartridgeList {

    export interface Props {
        cartridges?: {[key: string]: Cartridge};
        selectedKey?: string;

        onClick?: (key: string) => void;
    }

}

export default CartridgeList;
