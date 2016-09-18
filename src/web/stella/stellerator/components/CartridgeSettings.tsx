// tslint:disable-next-line
import * as React from 'react';

import {ControlLabel} from 'react-bootstrap';

import CartridgeNameInput from './CartridgeNameInput';
import TvModeSelect from './TvModeSelect';
import CartridgeTypeSelect from './CartridgeTypeSelect';
import Switch from './Switch';
import RandomSeedEdit from './RandomSeedEdit';

function CartridgeSettings(props: CartridgeSettings.Props) {
    return <div className={props.visible ? '' : 'hidden'}>
        <ControlLabel>Name:</ControlLabel>
        <CartridgeNameInput {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>TV mode:</ControlLabel>
        <TvModeSelect {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>Cartridge Type:</ControlLabel>
        <CartridgeTypeSelect {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>Emulate Paddles:</ControlLabel>
        <Switch
            state={props.emulatePaddles}
            labelTrue="yes"
            labelFalse="no"
            onSwitch={props.onTogglePaddleEmulation}
        />

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>RNG seed:</ControlLabel>
        <RandomSeedEdit {...props}/>
    </div>;
}

module CartridgeSettings {

    export interface Props extends
        CartridgeNameInput.Props,
        TvModeSelect.Props,
        CartridgeTypeSelect.Props,
        RandomSeedEdit.Props
    {
        visible?: boolean;
        emulatePaddles?: boolean;

        onTogglePaddleEmulation?: (state: boolean) => void;
    }

    export const defaultProps: Props = Object.assign(
        {
            visible: false,
            emulatePaddles: true,

            onTogglePaddleEmulation: (): void => undefined
        },
        CartridgeNameInput.defaultProps,
        TvModeSelect.defaultProps,
        CartridgeTypeSelect.defaultProps,
        RandomSeedEdit.defaultProps
    );

}

export default CartridgeSettings;
