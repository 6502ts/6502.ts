// tslint:disable-next-line
import * as React from 'react';
import {FormControl} from 'react-bootstrap';

function CartridgeNameInput(props: CartridgeNameInput.Props) {
    return <FormControl
        type="text"
        value={props.name}
        onChange={(e: React.FormEvent) => props.onNameChange((e.target as HTMLInputElement).value)}
        onKeyDown={(e: React.KeyboardEvent) => e.keyCode === 13 ? props.onKeyEnter() : undefined}
    />;
}

module CartridgeNameInput {

    export interface Props {
        name?: string;
        onNameChange?: (value: string) => void;
        onKeyEnter?: () => void;
    }

    export const defaultProps: Props = {
        name : '',
        onNameChange: () => undefined,
        onKeyEnter: () => undefined,
    };

}

export default CartridgeNameInput;
