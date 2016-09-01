// tslint:disable-next-line
import * as React from 'react';

import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

import {
    DropdownButton,
    MenuItem
} from 'react-bootstrap';

class CartridgeTypeSelect extends React.Component<CartridgeTypeSelect.Props, CartridgeTypeSelect.State> {

    render() {
        return <DropdownButton
            id={this.state.id}
            title={CartridgeInfo.describeCartridgeType(this.props.cartridgeType)}
            onSelect={this.props.onCartridgeTypeChange as any}
        >
            {CartridgeInfo.getAllTypes().map(cartridgeType =>
                <MenuItem
                    eventKey={cartridgeType}
                    active={cartridgeType === this.props.cartridgeType}
                    key={cartridgeType}
                >
                    {CartridgeInfo.describeCartridgeType(cartridgeType)}
                </MenuItem>
            )}
        </DropdownButton>;
    }

    state: CartridgeTypeSelect.State = {
        id: `cartridge_type_select_${Math.floor(Math.random() * 10000000)}`
    };

    static defaultProps: CartridgeTypeSelect.Props = {
        cartridgeType: CartridgeInfo.CartridgeType.unknown,
        onCartridgeTypeChange: (): void => undefined
    };

}

module CartridgeTypeSelect {

    export interface Props {
        cartridgeType?: CartridgeInfo.CartridgeType;
        onCartridgeTypeChange?: (t: CartridgeInfo.CartridgeType) => void;
    }

    export interface State {
        id: string;
    }

}

export default CartridgeTypeSelect;
