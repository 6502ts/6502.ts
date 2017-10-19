/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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
import { Button, Modal, DropdownButton, MenuItem } from 'react-bootstrap';

import { styled } from '../style';

export interface Props {
    show: boolean;
    files: Array<string>;

    onCancel?: () => void;
    onSelect?: (file: string) => void;
}

interface State {
    selectedIndex: number;
}

let index = 0;

const Container = styled.div`margin-bottom: 1rem;`;

class ZipfileSelectModal extends React.PureComponent<Props, State> {
    componentWillReceiveProps(newProps: Props) {
        if (this.props.show && !newProps.show) {
            this.setState({ selectedIndex: 0 });
        }
    }

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onCancel} backdrop={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Multiple ROM images</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>This archive contains multiple ROM images.</Container>
                    <Container>
                        Select one:{' '}
                        <DropdownButton
                            id={this._id}
                            title={this.props.files.length > 0 ? this.props.files[this.state.selectedIndex] : ''}
                            onSelect={(idx: any) => this.setState({ selectedIndex: idx })}
                        >
                            {this.props.files.map((file: string, i: number) => (
                                <MenuItem key={i} eventKey={i} active={i === this.state.selectedIndex}>
                                    {this.props.files[i]}
                                </MenuItem>
                            ))}
                        </DropdownButton>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.onCancel}>Cancel</Button>
                    <Button onClick={() => this.props.onSelect(this.props.files[this.state.selectedIndex])}>
                        Continue
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    static defaultProps: Props = {
        show: false,
        files: [],
        onCancel: () => undefined,
        onSelect: () => undefined
    };

    state = {
        selectedIndex: 0
    };

    private _id = `zipfile-dropdown-${index++}`;
}

export default ZipfileSelectModal;
