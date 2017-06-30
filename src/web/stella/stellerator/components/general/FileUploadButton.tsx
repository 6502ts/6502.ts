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

interface State {
    id: string;
}

class FileUploadButton extends React.Component<FileUploadButton.Props, State> {

    render() {
        return <div className='btn btn-default' style={{display: 'inline-block'}}>
            <label htmlFor={this.state.id}>{this.props.children}</label>
            <input
                accept={this.props.accept}
                type='file'
                id={this.state.id}
                style={{display: 'none'}}
                onChange={this._onChange.bind(this)}
            />
        </div>;
    }

    private _onChange(e: Event) {
        this.props.onFilesSelected((e.currentTarget as HTMLInputElement).files);
    }

    state: State = {
        id: `file_upload_${Math.floor(Math.random() * 10000000)}`
    };

}

namespace FileUploadButton {

    export interface Props {
        accept?: string;
        onFilesSelected?: (files: FileList) => void;
    }

    export const defaultProps: Props = {
        onFilesSelected: () => undefined
    };

}

export default FileUploadButton;
