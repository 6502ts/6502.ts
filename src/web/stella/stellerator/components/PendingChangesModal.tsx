// tslint:disable-next-line
import * as React from 'react';

import {
    Button,
    Modal
} from 'react-bootstrap';

function PendingChangesModal(props: PendingChangesModal.Props) {
    return <Modal show={props.show} onHide={props.onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Unsaved changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {props.children}
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={props.onHide}>Cancel</Button>
            <Button onClick={props.onContinueAndSave}>Continue &amp; Save</Button>
            <Button onClick={props.onContinueAndDiscard}>Continue &amp; Discard</Button>
        </Modal.Footer>
    </Modal>;
}

module PendingChangesModal {

    export interface Props {
        show?: boolean;
        onHide?: () => void;
        onContinueAndDiscard?: () => void;
        onContinueAndSave?: () => void;
        children?: React.ReactNode;
    }

    export const defaultProps: Props = {
        show: false,
        onHide: () => undefined,
        onContinueAndDiscard: () => undefined,
        onContinueAndSave: () => undefined
    };

}

export default PendingChangesModal;
