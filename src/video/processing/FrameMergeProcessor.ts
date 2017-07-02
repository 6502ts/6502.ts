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

import {Event} from 'microevent.ts';

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
                0xFF000000                                                               |
                ((((buffer0[i] & 0xFF0000) + (buffer1[i] & 0xFF0000)) >>> 1) & 0xFF0000) |
                ((((buffer0[i] & 0xFF00) + (buffer1[i] & 0xFF00)) >>> 1) & 0xFF00)       |
                ((((buffer0[i] & 0xFF) + (buffer1[i] & 0xFF)) >>> 1) & 0xFF);
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

export default FrameMergeProcessor;
