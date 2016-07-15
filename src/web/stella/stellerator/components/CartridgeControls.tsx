import * as React from 'react';

import {
    Button
} from 'react-bootstrap';

class CartridgeControls extends React.Component<CartridgeControls.Props, {}> {

    static defaultProps: CartridgeControls.Props = {
        active: false,
        changes: false,
        onDelete: () => undefined,
        onSave: () => undefined,
        onRun: () => undefined
    };

    render() {
        return <div className="cartridge-controls">
            <Button>Upload</Button>
            <Button
                disabled={!this.props.active}
                onClick={this.props.onDelete}
            >Delete</Button>
            <Button
                disabled={!this.props.active || !this.props.changes}
                onClick={this.props.onSave}
            >Save</Button>
            <Button
                disabled={!this.props.active}
                onClick={this.props.onRun}
            >
                {this.props.changes ? 'Save & Run' : 'Run'}
            </Button>
        </div>;
    }

}

module CartridgeControls {

    export interface Props {

        active?: boolean;
        changes?: boolean;

        onDelete?: () => void;
        onSave?: () => void;
        onRun?: () => void;

    }

}

export default CartridgeControls;
