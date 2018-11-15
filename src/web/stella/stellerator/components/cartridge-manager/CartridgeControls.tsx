/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import { styled } from '../style';
import { Button } from 'react-bootstrap';

import FileUploadButton from '../general/FileUploadButton';
import { StyledComponentClass } from 'styled-components';
import Theme from '../style/Theme';

export interface Props {
    active: boolean;
    changes: boolean;
    className?: string;

    onDelete?: () => void;
    onSave?: () => void;
    onRun?: () => void;
    onCartridgeUploaded?: (file: File) => void;
    onDownload?: () => void;
}

function CartridgeControlsUnstyled(props: Props) {
    return (
        <div className={props.className}>
            <FileUploadButton
                accept=".bin, .a26, .zip"
                onFilesSelected={files => (files.length === 1 ? props.onCartridgeUploaded(files[0]) : undefined)}
            >
                Load
            </FileUploadButton>
            <Button disabled={!props.active} onClick={props.onDelete}>
                Delete
            </Button>
            <Button disabled={!props.active || !props.changes} onClick={props.onSave}>
                Save
            </Button>
            <Button disabled={!props.active} onClick={props.onRun}>
                {props.changes ? 'Save & Run' : 'Run'}
            </Button>
            <Button disabled={!props.active} onClick={props.onDownload}>
                Download
            </Button>
        </div>
    );
}

namespace CartridgeControlsUnstyled {
    export const defaultProps: Props = {
        active: false,
        changes: false,
        onDelete: (): void => undefined,
        onSave: (): void => undefined,
        onRun: (): void => undefined,
        onCartridgeUploaded: (): void => undefined,
        onDownload: (): void => undefined
    };
}

type CartridgeControlsStyled = StyledComponentClass<Props, Theme>;

const CartridgeControlsStyled = styled(CartridgeControlsUnstyled)`
    .btn:not(:last-child) {
        margin-right: 2ex;
    }

    .btn {
        margin-bottom: 0.5rem;
    }

    button[disabled] {
        color: #777;
    }
`;

export { CartridgeControlsStyled as default };
