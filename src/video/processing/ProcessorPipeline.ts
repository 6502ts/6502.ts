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

import {EventInterface} from 'microevent.ts';

import RGBASurfaceInterface from '../surface/RGBASurfaceInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import ProcessorInterface from './ProcessorInterface';
import ProcessorFactory from './ProcessorFactory';
import {ProcessorConfig, Type} from './config';

class ProcessorPipeline implements ProcessorInterface {

    constructor(config?: Array<ProcessorConfig>) {
        if (!config || config.length === 0) {
            config = [{type: Type.passthrough}];
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

export default ProcessorPipeline;
