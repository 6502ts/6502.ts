/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2017 Christian Speckner & contributors
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

import * as React from 'react';
import {
    Button,
    Modal
} from 'react-bootstrap';

export interface Props {
    errorMessage: string;

    onClose?: () => void;
}

function ZipfileErrorModal(props: Props) {
    return (
        <Modal show={!!props.errorMessage} onHide={props.onClose} backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title>Error reading archive</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {props.errorMessage}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={props.onClose}
                >
                    Continue
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

namespace ZipfileErrorModal {

    export const defaultProps: Props = {
        errorMessage: '',

        onClose: () => undefined
    };

}

export default ZipfileErrorModal;
