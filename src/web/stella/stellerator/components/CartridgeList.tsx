// tslint:disable-next-line
import * as React from 'react';

import Cartridge from '../state/Cartridge';

function CartridgeList(props: CartridgeList.Props) {
    return  <div className="cartridge-list border-box">
        <ul>
            {Object
                .keys(props.cartridges)
                .map(key => props.cartridges[key])
                .sort((c1: Cartridge, c2: Cartridge) => c1.name === c2.name ? 0 : ((c1.name < c2.name) ? -1 : 1))
                .map(
                    cartridge =>
                    <li
                        onClick={() => props.onClick(cartridge.hash, props.pendingChanges)}
                        className={props.selectedKey === cartridge.hash ? 'selected' : ''}
                    >
                        {cartridge.name}
                    </li>
                )
            }
        </ul>
    </div>;
}

module CartridgeList {

    export interface Props {
        cartridges?: {[key: string]: Cartridge};
        pendingChanges: boolean;
        selectedKey?: string;

        onClick?: (key: string, pendingChanges: boolean) => void;
    }

    export const defaultProps: Props = {
        cartridges: {},
        selectedKey: '',
        pendingChanges: false,
        onClick: () => undefined
    };

}

export default CartridgeList;
