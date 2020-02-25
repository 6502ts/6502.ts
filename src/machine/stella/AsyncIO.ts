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

import { Event } from 'microevent.ts';

import Bus from './Bus';
import Board from './Board';
import AsyncIOInterface from '../io/AsyncIOInterface';

class AsyncIO implements AsyncIOInterface {
    constructor(private _board: Board) {
        this._bus = this._board.getBus();

        this._board.systemReset.addHandler(AsyncIO._onReset, this);
        this._bus.event.write.addHandler(AsyncIO._onWrite, this);
        this._bus.event.read.addHandler(AsyncIO._onRead, this);

        this.reset();
    }

    reset(): this {
        for (let i = 0; i < this._bufferOut.length; i++) {
            this._bufferOut[i] = 0;
        }

        this._indexBufferOut = 0;

        return this;
    }

    send(message: ArrayLike<number>): void {
        this._indexBufferIn = message.length > 256 ? 255 : message.length - 1;

        for (let i = 0; i <= this._indexBufferIn; i++) {
            this._bufferIn[i] = message[i];
        }
    }

    private static _onWrite(accessType: Bus.AccessType, self: AsyncIO): void {
        if (accessType !== Bus.AccessType.tia) {
            return;
        }

        switch (self._bus.getLastAddresBusValue()) {
            case 0x30:
                self._bufferOut[self._indexBufferOut] = self._bus.getLastDataBusValue();
                self._indexBufferOut = (self._indexBufferOut + 1) % self._bufferOut.length;

                break;

            case 0x31: {
                const count = self._bus.getLastDataBusValue();
                const data = new Uint8Array(count);

                for (let i = 0; i < count; i++) {
                    const j = (self._indexBufferOut - 1 + self._bufferOut.length) % self._bufferOut.length;

                    data[count - i - 1] = self._bufferOut[j];
                    self._indexBufferOut = j;
                }

                self.message.dispatch(data);

                break;
            }
        }
    }

    private static _onRead(accessType: Bus.AccessType, self: AsyncIO): void {
        if (accessType !== Bus.AccessType.tia) {
            return;
        }

        switch (self._bus.getLastAddresBusValue()) {
            case 0x30:
                self._bus.setDataBusValue(self._indexBufferIn >= 0 ? self._bufferIn[self._indexBufferIn--] : 0);

                break;

            case 0x31: {
                self._bus.setDataBusValue(self._indexBufferIn >= 0 ? self._indexBufferIn + 1 : 0);

                break;
            }
        }
    }

    private static _onReset(payload: void, self: AsyncIO): void {
        self.reset();
    }

    message = new Event<Uint8Array>();

    private readonly _bufferOut = new Uint8Array(256);
    private readonly _bufferIn = new Uint8Array(256);
    private _indexBufferOut = 0;
    private _indexBufferIn = -1;

    private _bus: Bus = null;
}

export default AsyncIO;
