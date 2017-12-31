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

interface CpuInterface {
    setInterrupt(irq: boolean): CpuInterface;

    isInterrupt(): boolean;

    nmi(): CpuInterface;

    halt(): CpuInterface;

    resume(): CpuInterface;

    isHalt(): boolean;

    setInvalidInstructionCallback(callback: CpuInterface.InvalidInstructionCallbackInterface): CpuInterface;

    getInvalidInstructionCallback(): CpuInterface.InvalidInstructionCallbackInterface;

    getLastInstructionPointer(): number;

    reset(): CpuInterface;

    cycle(): CpuInterface;

    executionState: CpuInterface.ExecutionState;
    state: CpuInterface.State;
}

namespace CpuInterface {
    export const enum ExecutionState {
        boot,
        fetch,
        execute
    }

    export class State {
        a: number = 0;
        x: number = 0;
        y: number = 0;
        s: number = 0;
        p: number = 0;
        flags: number = 0;

        irq = false;
        nmi = false;
    }

    export const enum Flags {
        c = 0x01, // carry
        z = 0x02, // zero
        i = 0x04, // interrupt
        d = 0x08, // decimal mode
        b = 0x10, // break
        e = 0x20, // reserved
        v = 0x40, // overflow
        n = 0x80 // sign
    }

    export interface InvalidInstructionCallbackInterface {
        (cpu?: CpuInterface): void;
    }
}

export default CpuInterface;
