/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

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
