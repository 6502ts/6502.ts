// tslint:disable-next-line
import * as React from 'react';

import Cartridge from '../state/Cartridge';

function CartridgeList(props: CartridgeList.Props) {
    return  <div className="cartridge-list border-box">
        <ul>
            {Object.keys(props.cartridges).map(
                key =>
                <li
                    onClick={() => props.onClick(key, props.pendingChanges)}
                    className={props.selectedKey === key ? 'selected' : ''}
                >
                    {props.cartridges[key].name}
                </li>
            )}
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
