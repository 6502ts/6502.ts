// tslint:disable-next-line
import * as React from 'react';

import {
    Button,
    ButtonGroup
} from 'react-bootstrap';

function Switch(props: Switch.Props) {
    return <ButtonGroup>
        <Button
            active={!props.state}
            onClick={() => props.onSwitch(false)}
        >{props.labelFalse}</Button>
        <Button
            active={props.state}
            onClick={() => props.onSwitch(true)}
        >{props.labelTrue}</Button>
    </ButtonGroup>;
}

module Switch {

    export interface Props {
        state?: boolean;
        labelTrue?: string;
        labelFalse?: string;

        onSwitch?: (state: boolean) => void;
    }

    export const defaultProps: Props = {
        state: false,
        labelTrue: 'on',
        labelFalse: 'off',

        onSwitch: () => undefined
    };

}

export default Switch;
