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

import PaddleInterface from '../../machine/io/PaddleInterface';

export default class MouseAsPaddleDriver {
    bind(paddle: PaddleInterface): void {
        if (this._paddle) {
            return;
        }

        this._paddle = paddle;
        this._x = -1;

        document.addEventListener('mousemove', this._listener);
    }

    unbind(): void {
        if (!this._paddle) {
            return;
        }

        document.removeEventListener('mousemove', this._listener);
        this._paddle = null;
    }

    private _onDocumentMouseMove(e: MouseEvent) {
        if (this._x >= 0) {
            const dx = e.screenX - this._x;
            let value = this._paddle.getValue();

            value += -dx / window.innerWidth / 0.9;
            if (value < 0) {
                value = 0;
            }
            if (value > 1) {
                value = 1;
            }

            this._paddle.setValue(value);
        }

        this._x = e.screenX;
    }

    private _paddle: PaddleInterface;
    private _x = -1;
    private _listener: (e: MouseEvent) => void = this._onDocumentMouseMove.bind(this);
}
