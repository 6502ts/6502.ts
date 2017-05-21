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

import * as React from 'react';

import {
    Button
} from 'react-bootstrap';

import FileUploadButton from '../FileUploadButton';

function CartridgeControls(props: CartridgeControls.Props) {
    return <div className='cartridge-controls'>
        <FileUploadButton
            onFilesSelected={
                files => files.length === 1 ? props.onCartridgeUploaded(files[0], props.changes) : undefined
            }
        >Load</FileUploadButton>
        <Button
            disabled={!props.active}
            onClick={props.onDelete}
        >Delete</Button>
        <Button
            disabled={!props.active || !props.changes}
            onClick={props.onSave}
        >Save</Button>
        <Button
            disabled={!props.active}
            onClick={props.onRun}
        >
            {props.changes ? 'Save & Run' : 'Run'}
        </Button>
    </div>;
}

namespace CartridgeControls {

    export interface Props {

        active?: boolean;
        changes?: boolean;

        onDelete?: () => void;
        onSave?: () => void;
        onRun?: () => void;
        onCartridgeUploaded?: (file: File, changes: boolean) => void;

    }

    export const defaultProps: Props = {
        active: false,
        changes: false,
        onDelete: (): void => undefined,
        onSave: (): void => undefined,
        onRun: (): void => undefined,
        onCartridgeUploaded: (): void => undefined
    };

}

export default CartridgeControls;
