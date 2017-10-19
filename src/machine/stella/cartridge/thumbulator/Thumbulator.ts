/*
 * Copyright (c) 2017 Christian Speckner & Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/

import * as nativeThumbulator from './native/thumbulator';

interface EmModule {
    _run(cycles: number): Thumbulator.TrapReason;
    _enable_debug(enable: number): void;
    _reset(): void;
    _read_register(register: number): number;
    _write_register(register: number, value: number): void;
}

interface EmModuleApi {
    print(data: string): void;
    printErr(data: string): void;
    trapOnInstructionFetch(address: number): number;

    busRead16(address: number): number;
    busRead32(address: number): number;

    busWrite16(address: number, value: number): void;
    busWrite32(address: number, value: number): void;
}

class Thumbulator {
    constructor(bus: Thumbulator.Bus, options: Thumbulator.Options = {}) {
        this._module = nativeThumbulator(this._getApi(bus, options));
        this.enableDebug(false);
    }

    run(cycles: number): Thumbulator.TrapReason | number {
        return this._module._run(cycles);
    }

    enableDebug(enable: boolean) {
        this._module._enable_debug(enable ? 1 : 0);
    }

    reset(): void {
        this._module._reset();
    }

    readRegister(register: number): number {
        if (register < 0 || register > 15) {
            throw new Error(`illegal thumb register ${register}`);
        }

        return this._module._read_register(register);
    }

    writeRegister(register: number, value: number) {
        if (register < 0 || register > 15) {
            throw new Error(`illegal thumb register ${register}`);
        }

        this._module._write_register(register, value);
    }

    private _getApi(bus: Thumbulator.Bus, options: Thumbulator.Options): EmModuleApi {
        const printer = options.printer || (data => console.log('thumbulator: ' + data));

        return {
            print: printer,
            printErr: printer,
            trapOnInstructionFetch: options.trapOnInstructionFetch || (() => 0),

            busRead16: bus.read16,
            busRead32: bus.read32 || (address => (bus.read16(address) & 0xffff) | (bus.read16(address + 2) << 16)),

            busWrite16: bus.write16,
            busWrite32:
                bus.write32 ||
                ((address, value) => (bus.write16(address, value & 0xffff), bus.write16(address + 2, value >>> 16)))
        };
    }

    private _module: EmModule = null;
}

namespace Thumbulator {
    export const enum TrapReason {
        noTrap = 0,
        breakpoint = 1,
        blxLeaveThumb = 2,
        bxLeaveThumb = 3
    }

    export interface Bus {
        read16(address: number): number;
        read32?(address: number): number;

        write16(address: number, value: number): void;
        write32?(address: number, value: number): void;
    }

    export interface Options {
        printer?: (data: string) => void;
        trapOnInstructionFetch?: (address: number) => number;
    }
}

export default Thumbulator;
