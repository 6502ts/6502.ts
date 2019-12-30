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

import { EventInterface } from 'microevent.ts';

import RGBASurfaceInterface from '../surface/RGBASurfaceInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import ProcessorInterface from './ProcessorInterface';
import ProcessorFactory from './ProcessorFactory';
import { ProcessorConfig, Type } from './config';

class ProcessorPipeline implements ProcessorInterface {
    constructor(config?: Array<ProcessorConfig>) {
        if (!config || config.length === 0) {
            config = [{ type: Type.passthrough }];
        }

        const factory = new ProcessorFactory();

        this._processors = config.map(cfg => factory.create(cfg));

        for (let i = 1; i < this._processors.length; i++) {
            this._processors[i - 1].emit.addHandler(surface => this._processors[i].processSurface(surface));
        }

        this.emit = this._processors[this._processors.length - 1].emit;
    }

    init(width: number, height: number): void {
        this._processors.forEach(prc => prc.init(width, height));
    }

    flush(): void {
        this._processors.forEach(prc => prc.flush());
    }

    processSurface(surface: PoolMemberInterface<RGBASurfaceInterface>): void {
        this._processors[0].processSurface(surface);
    }

    emit: EventInterface<PoolMemberInterface<RGBASurfaceInterface>>;

    private _processors: Array<ProcessorInterface>;
}

export { ProcessorPipeline as default };
