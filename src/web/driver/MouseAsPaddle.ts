/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import PaddleInterface from '../../machine/io/PaddleInterface';

export default class MouseAsPaddleDriver {
    bind(paddle: PaddleInterface): void {
        if (this._paddle) {
            return;
        }

        this._paddle = paddle;
        this._x = -1;

        document.addEventListener('mousemove', this._mousemoveListener);
        document.addEventListener('mousedown', this._mousedownListener);
        document.addEventListener('mouseup', this._mouseupListener);
    }

    unbind(): void {
        if (!this._paddle) {
            return;
        }

        document.removeEventListener('mousemove', this._mousemoveListener);
        document.removeEventListener('mousedown', this._mousedownListener);
        document.removeEventListener('mouseup', this._mouseupListener);
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

    private _onDocumentMouseDown(e: MouseEvent) {
        this._paddle.getFire().toggle(true);
    }

    private _onDocumentMouseUp(e: MouseEvent) {
        this._paddle.getFire().toggle(false);
    }

    private _paddle: PaddleInterface;
    private _x = -1;
    private _mousemoveListener: (e: MouseEvent) => void = this._onDocumentMouseMove.bind(this);
    private _mousedownListener: (e: MouseEvent) => void = this._onDocumentMouseDown.bind(this);
    private _mouseupListener: (e: MouseEvent) => void = this._onDocumentMouseUp.bind(this);
}
