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

import VanillaMemory from '../vanilla/Memory';
import SimpleSerialIOInterface from '../io/SimpleSerialIOInterface';
import CpuInterface from '../cpu/CpuInterface';

class Memory extends VanillaMemory implements SimpleSerialIOInterface {
    reset(): void {
        super.reset();

        this._feedbackRegister = 0;
    }

    setCpu(cpu: CpuInterface): this {
        this._cpu = cpu;

        return this;
    }

    read(address: number): number {
        switch (address) {
            case 0xf002:
                return this._feedbackRegister;

            case 0xf004:
                return this._inCallback(this);

            default:
                return this._data[address];
        }
    }

    readWord(address: number): number {
        if ((address & 0xfff0) === 0xf000) {
            return this.read(address) + (this.read((address + 1) & 0xffff) << 8);
        }

        return this._data[address] + (this._data[(address + 1) & 0xffff] << 8);
    }

    write(address: number, value: number) {
        switch (address) {
            case 0xf001:
                this._outCallback(value, this);
                break;

            case 0xf002:
                this._cpu.setInterrupt(!!(value & 0x01));
                if (value & 0x02 && !(this._feedbackRegister & 0x02)) {
                    this._cpu.nmi();
                }

                this._feedbackRegister = value;
                break;

            default:
                if (address < 0xc000) {
                    this._data[address] = value;
                }
                break;
        }
    }

    setInCallback(callback: SimpleSerialIOInterface.InCallbackInterface): Memory {
        this._inCallback = callback;
        return this;
    }

    getInCallback(): SimpleSerialIOInterface.InCallbackInterface {
        return this._inCallback;
    }

    setOutCallback(callback: SimpleSerialIOInterface.OutCallbackInterface): Memory {
        this._outCallback = callback;
        return this;
    }

    getOutCallback(): SimpleSerialIOInterface.OutCallbackInterface {
        return this._outCallback;
    }

    private _inCallback: SimpleSerialIOInterface.InCallbackInterface = (): number => 0x00;
    private _outCallback: SimpleSerialIOInterface.OutCallbackInterface = (): void => undefined;

    private _cpu: CpuInterface;
    private _feedbackRegister = 0;
}

export { Memory as default };
