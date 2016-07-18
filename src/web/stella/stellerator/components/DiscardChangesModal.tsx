import * as React from 'react';

import {
    Button,
    Modal
} from 'react-bootstrap';

class DiscardChangesModal extends React.Component<DiscardChangesModal.Props, {}> {

    render() {
        return <Modal show={this.props.show} onHide={this.props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Unsaved changes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    There are unsaved changes in the currently selected cartridge.
                    Selecting another cartridge will discard these changes.
                </p>
                <p>
                    Do you want to continue?
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={this.props.onHide}>Cancel</Button>
                <Button onClick={this.props.onContinueAndSave}>Continue &amp; Save</Button>
                <Button onClick={this.props.onContinueAndDiscard}>Continue &amp; Discard</Button>
            </Modal.Footer>
        </Modal>;
    }

    static defaultProps: DiscardChangesModal.Props = {
        show: false,
        onHide: () => undefined,
        onContinueAndDiscard: () => undefined,

    };

}

module DiscardChangesModal {

    export interface Props {
        show?: boolean;
        onHide?: () => void;
        onContinueAndDiscard?: () => void;
        onContinueAndSave?: () => void;
    }

}

export default DiscardChangesModal;
