// tslint:disable-next-line
import * as React from 'react';

import {ControlLabel} from 'react-bootstrap';

import CartridgeNameInput from './CartridgeNameInput';
import TvModeSelect from './TvModeSelect';
import CartridgeTypeSelect from './CartridgeTypeSelect';

function CartridgeSettings(props: CartridgeSettings.Props) {
    return <div className={props.visible ? '' : 'hidden'}>
        <ControlLabel>Name:</ControlLabel>
        <CartridgeNameInput {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>TV mode:</ControlLabel>
        <TvModeSelect {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>Cartridge Type:</ControlLabel>
        <CartridgeTypeSelect {...props}/>
    </div>;
}

module CartridgeSettings {

    export interface Props extends
        CartridgeNameInput.Props,
        TvModeSelect.Props,
        CartridgeTypeSelect.Props
    {
        visible?: boolean;
    }

    export const defaultProps: Props = Object.assign(
        {
            visible: false
        },
        CartridgeNameInput.defaultProps,
        TvModeSelect.defaultProps,
        CartridgeTypeSelect.defaultProps
    );

}

export default CartridgeSettings;
