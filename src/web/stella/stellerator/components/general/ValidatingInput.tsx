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
import * as classnames from 'classnames';
import { FormControl } from 'react-bootstrap';

class ValidatingInput extends React.Component<ValidatingInput.Props, ValidatingInput.State> {
    constructor(props?: ValidatingInput.Props, context?: any) {
        super(props, context);

        this.state = {
            rawValue: props.value
        };
    }

    render() {
        return (
            <FormControl
                type="text"
                className={classnames(
                    this.props.className,
                    this.props.validator(this.state.rawValue) ? 'valid' : 'invalid'
                )}
                value={this.state.rawValue}
                onChange={(e: React.FormEvent<any>) => this._onChange((e.target as HTMLInputElement).value)}
                onKeyDown={(e: React.KeyboardEvent<any>) => (e.keyCode === 13 ? this.props.onKeyEnter() : undefined)}
                readOnly={this.props.readOnly}
                style={this.props.style}
            />
        );
    }

    componentWillReceiveProps(props: ValidatingInput.Props): void {
        this.setState({ rawValue: props.value });
    }

    private _onChange(newValue: string): void {
        this.setState({ rawValue: newValue });

        if (this.props.validator(newValue)) {
            this.props.onChange(newValue);
        }
    }
}

namespace ValidatingInput {
    export interface Props {
        value?: string;
        readOnly?: boolean;
        style?: { [key: string]: any };
        className?: string;

        onChange?: (value: string) => void;
        onKeyEnter?: () => void;
        validator?: (rawValue: string) => boolean;
    }

    export interface State {
        rawValue: string;
    }

    export const defaultProps: Props = {
        value: '',
        readOnly: false,

        onChange: () => undefined,
        onKeyEnter: () => undefined,
        validator: () => true
    };
}

export { ValidatingInput as default };
