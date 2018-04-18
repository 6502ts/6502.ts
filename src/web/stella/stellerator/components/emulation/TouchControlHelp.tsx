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

import { Button, Modal } from 'react-bootstrap';

const MAX_PAGE = 1;

export interface Props {
    leftHanded?: boolean;
}

interface State {
    page: number;
}

class TouchControlHelp extends React.Component<Props, State> {

    show(): void {
        this.setState({page: 0});
    }

    render() {
        return (
            <Modal show={this.state.page <= MAX_PAGE} onHide={() => this.setState({page: MAX_PAGE + 1})} backdrop={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Touch control layout</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        {this._getLayoutHeading()}
                    </p>
                    <img className="touch-control-layout" src={this._getImageUrl()}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={() => this.setState(s => ({page: s.page + 1}))}
                    >{this.state.page < MAX_PAGE ? 'Next' : 'Close'}</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    private _getImageUrl(): string {
        switch (this.state.page) {
            case 0:
                return this.props.leftHanded ? 'doc/images/2600_touch_lh.jpg' : 'doc/images/2600_touch.jpg';

            case 1:
                return this.props.leftHanded ? 'doc/images/2600_touch_alt_lh.jpg' : 'doc/images/2600_touch_alt.jpg';

            default:
                return '';
        }
    }

    private _getLayoutHeading(): string {
        switch (this.state.page) {
            case 0:
                return 'Standard mode:';

            case 1:
                return (this.props.leftHanded ? 'Alt mode (hold NE):' : 'Alt mode (hold NW):');

            default:
                return '';
        }
    }

    state = {
        page: MAX_PAGE + 1
    };
}

export default TouchControlHelp;
