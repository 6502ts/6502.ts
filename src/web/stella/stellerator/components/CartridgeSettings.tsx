import * as React from 'react';

import {
    ControlLabel,
    FormControl
} from 'react-bootstrap';

class CartridgeSettings extends React.Component<CartridgeSettings.Props, {}> {

    static defaultProps: CartridgeSettings.Props = {
        name : '',
        onNameChange: () => undefined,
        visible: false
    };

    render() {
        return <div className={this.props.visible ? '' : 'hidden'}>
            <ControlLabel>Name:</ControlLabel>
            <FormControl
                type="text"
                value={this.props.name}
                onChange={(e: Event) => this.props.onNameChange((e.target as HTMLInputElement).value)}
            />
        </div>;
    }

}

module CartridgeSettings {

    export interface Props {
        name?: string;
        visible?: boolean;
        onNameChange?: (value: string) => void;
    }

}

export default CartridgeSettings;
