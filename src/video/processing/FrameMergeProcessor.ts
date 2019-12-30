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

import ProcessorInterface from './ProcessorInterface';
import RGBASurfaceInterface from '../surface/RGBASurfaceInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';

class FrameMergeProcessor implements ProcessorInterface {
    init(width: number, height: number) {
        this.flush();

        this._width = width;
        this._height = height;
    }

    flush(): void {
        for (let i = 0; i < this._nFramesOnHold; i++) {
            this._framesOnHold[i].release();
            this._framesOnHold[i] = null;
        }

        this._nFramesOnHold = 0;
    }

    processSurface(wrappedSurface: PoolMemberInterface<RGBASurfaceInterface>): void {
        const surface = wrappedSurface.get();

        if (surface.getHeight() !== this._height || surface.getWidth() !== this._width) {
            throw new Error('surface dimensions do not match');
        }

        this._framesOnHold[this._nFramesOnHold++] = wrappedSurface;

        if (this._nFramesOnHold === 2) {
            this._process();
        }
    }

    private _process(): void {
        const buffer0 = this._framesOnHold[0].get().getBuffer(),
            buffer1 = this._framesOnHold[1].get().getBuffer();

        for (let i = 0; i < this._width * this._height; i++) {
            buffer0[i] =
                0xff000000 |
                ((((buffer0[i] & 0xff0000) + (buffer1[i] & 0xff0000)) >>> 1) & 0xff0000) |
                ((((buffer0[i] & 0xff00) + (buffer1[i] & 0xff00)) >>> 1) & 0xff00) |
                ((((buffer0[i] & 0xff) + (buffer1[i] & 0xff)) >>> 1) & 0xff);
        }

        this.emit.dispatch(this._framesOnHold[0]);
        this._framesOnHold[1].release();

        this._nFramesOnHold = 0;
    }

    emit = new Event<PoolMemberInterface<RGBASurfaceInterface>>();

    private _framesOnHold = new Array<PoolMemberInterface<RGBASurfaceInterface>>(2);
    private _nFramesOnHold = 0;

    private _width = 0;
    private _height = 0;
}

export { FrameMergeProcessor as default };
