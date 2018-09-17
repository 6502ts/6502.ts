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

import RngInterface from '../../tools/rng/GeneratorInterface';
import BusInterface from '../bus/BusInterface';
import CpuInterface from './CpuInterface';
import StateMachineCpu from './StateMachineCpu';
import BatchedAccessCpu from './BatchedAccessCpu';

class Factory {
    constructor(private _type: Factory.Type) {}

    create(bus: BusInterface, rng?: RngInterface): CpuInterface {
        switch (this._type) {
            case Factory.Type.stateMachine:
                return new StateMachineCpu(bus, rng);

            case Factory.Type.batchedAccess:
                return new BatchedAccessCpu(bus, rng);

            default:
                throw new Error('invalid CPU type');
        }
    }
}

namespace Factory {
    export enum Type {
        stateMachine,
        batchedAccess
    }
}

export default Factory;
