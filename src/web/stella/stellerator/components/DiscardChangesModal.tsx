// tslint:disable-next-line
import * as React from 'react';

import {
    Button,
    Modal
} from 'react-bootstrap';

function DiscardChangesModal(props: DiscardChangesModal.Props) {
    return <Modal show={props.show} onHide={props.onHide}>
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
            <Button onClick={props.onHide}>Cancel</Button>
            <Button onClick={props.onContinueAndSave}>Continue &amp; Save</Button>
            <Button onClick={props.onContinueAndDiscard}>Continue &amp; Discard</Button>
        </Modal.Footer>
    </Modal>;
}

module DiscardChangesModal {

    export interface Props {
        show?: boolean;
        onHide?: () => void;
        onContinueAndDiscard?: () => void;
        onContinueAndSave?: () => void;
    }

    export const defaultProps: Props = {
        show: false,
        onHide: () => undefined,
        onContinueAndDiscard: () => undefined,

    };

}

export default DiscardChangesModal;
