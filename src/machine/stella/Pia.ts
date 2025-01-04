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

import ControlPanelInterface from './ControlPanelInterface';
import DigitalJoystickInterface from '../io/DigitalJoystickInterface';
import Bus from './Bus';

import RngInterface from '../../tools/rng/GeneratorInterface';
import KeypadsReader from './KeypadsReader';
import PaddleInterface from '../io/PaddleInterface';
import Config from './Config';

class Pia {
    constructor(
        private _config: Config,
        private _controlPanel: ControlPanelInterface,
        private _joystick0: DigitalJoystickInterface,
        private _joystick1: DigitalJoystickInterface,
        private _paddles: Array<PaddleInterface>,
        private _keypads: KeypadsReader,
        private _rng?: RngInterface
    ) {
        this.reset();
    }

    reset(): void {
        for (let i = 0; i < 128; i++) {
            this.ram[i] = this._rng ? this._rng.int(0xff) : 0;
        }

        this._interruptFlag = 0;
        this._flagSetDuringThisCycle = false;

        this._timerDivide = 1024;
        this._subTimer = 0;
        this._rng.int(0xff);
        this._timerValue = 0;
        this._timerWrapped = false;
    }

    read(address: number): number {
        // RAM select = A9 low?
        if (address & 0x0200) {
            if (address & 0x0004) {
                return this._readTimer(address);
            } else {
                return this._readIo(address);
            }
        } else {
            // Mask out A7 - A15
            return this.ram[address & 0x7f];
        }
    }

    peek(address: number): number {
        // RAM select = A9 low?
        if (address & 0x0200) {
            if (address & 0x0004) {
                return this._peekTimer(address);
            } else {
                return this._readIo(address);
            }
        } else {
            // Mask out A7 - A15
            return this.ram[address & 0x7f];
        }
    }

    write(address: number, value: number) {
        // RAM select = A9 low?
        if (address & 0x0200) {
            if (address & 0x0004) {
                return this._writeTimer(address, value);
            } else {
                return this._writeIo(address, value);
            }
        } else {
            // Mask out A7 - A15
            this.ram[address & 0x7f] = value;
        }
    }

    cycle(): void {
        this._cycleTimer();
    }

    getDebugState(): string {
        return `divider: ${this._timerDivide} raw timer: INTIM: ${this._timerValue}`;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    private _writeIo(address: number, value: number): void {
        switch (address) {
            case Pia.Registers.swcha:
                this._keypads.swcha(value);
                break;
            case Pia.Registers.swacnt:
                this._keypads.swacnt(value);
                break;
        }
    }

    private _writeTimer(address: number, value: number): void {
        this._interruptFlag = 0;

        // clear bit 3 <-> interrupt enable/disable
        switch (address & 0x0297) {
            case Pia.Registers.t1024t:
                return this._setTimer(1024, value);

            case Pia.Registers.tim64t:
                return this._setTimer(64, value);

            case Pia.Registers.tim8t:
                return this._setTimer(8, value);

            case Pia.Registers.tim1t:
                return this._setTimer(1, value);
        }
    }

    private _setTimer(divide: number, value: number): void {
        this._timerDivide = divide;
        this._timerValue = value;
        this._subTimer = 0;
        this._timerWrapped = false;
    }

    private _readIo(address: number): number {
        switch (address & 0x0283) {
            case Pia.Registers.swcha:
                const port0 =
                    (this._config.controllerPort0 === Config.ControllerType.paddles) ? (
                        (this._paddles[1].getFire().read() ? 0 : 0x40) |
                        (this._paddles[0].getFire().read() ? 0 : 0x80)
                    ) : (
                        (this._joystick0.getUp().read() ? 0 : 0x10) |
                        (this._joystick0.getDown().read() ? 0 : 0x20) |
                        (this._joystick0.getLeft().read() ? 0 : 0x40) |
                        (this._joystick0.getRight().read() ? 0 : 0x80)
                    );
                const port1 =
                    (this._config.controllerPort1 === Config.ControllerType.paddles) ? (
                        (this._paddles[3].getFire().read() ? 0 : 0x04) |
                        (this._paddles[2].getFire().read() ? 0 : 0x08)
                    ) : (
                        (this._joystick1.getUp().read() ? 0 : 0x01) |
                        (this._joystick1.getDown().read() ? 0 : 0x02) |
                        (this._joystick1.getLeft().read() ? 0 : 0x04) |
                        (this._joystick1.getRight().read() ? 0 : 0x08)
                    );

                return port1 | port0;

            case Pia.Registers.swchb:
                return (
                    (this._controlPanel.getResetButton().read() ? 0 : 0x01) |
                    (this._controlPanel.getSelectSwitch().read() ? 0 : 0x02) |
                    (this._controlPanel.getColorSwitch().read() ? 0 : 0x08) |
                    (this._controlPanel.getDifficultySwitchP0().read() ? 0 : 0x40) |
                    (this._controlPanel.getDifficultySwitchP1().read() ? 0 : 0x80)
                );
        }

        return this._bus.getLastDataBusValue();
    }

    private _readTimer(address: number): number {
        if (address & 0x01) {
            const flag = this._interruptFlag;

            return flag & 0x80;
        } else {
            if (!this._flagSetDuringThisCycle) {
                this._interruptFlag = 0;
                this._timerWrapped = false;
            }

            return this._timerValue;
        }
    }

    private _peekTimer(address: number): number {
        return address & 0x01 ? this._interruptFlag & 0x80 : this._timerValue;
    }

    private _cycleTimer(): void {
        this._flagSetDuringThisCycle = false;

        if (this._timerWrapped) {
            this._timerValue = (this._timerValue + 0xff) & 0xff;
        } else if (this._subTimer === 0 && --this._timerValue < 0) {
            this._timerValue = 0xff;
            this._flagSetDuringThisCycle = true;
            this._interruptFlag = 0xff;
            this._timerWrapped = true;
        }

        if (++this._subTimer === this._timerDivide) {
            this._subTimer = 0;
        }
    }

    trap = new Event<Pia.TrapPayload>();

    ram = new Uint8Array(128);

    private _bus: Bus = null;

    private _timerValue = 255;
    private _subTimer = 0;
    private _timerDivide = 1024;
    private _interruptFlag = 0;
    private _timerWrapped = false;
    private _flagSetDuringThisCycle = false;
}

namespace Pia {
    export const enum Registers {
        swcha = 0x280,
        swacnt = 0x281,
        swchb = 0x282,
        swncnt = 0x283,
        intim = 0x284,
        instat = 0x285,
        tim1t = 0x294,
        tim8t = 0x295,
        tim64t = 0x296,
        t1024t = 0x297
    }

    export const enum TrapReason {
        invalidRead,
        invalidWrite
    }

    export class TrapPayload {
        constructor(public reason: TrapReason, public pia: Pia, public message?: string) { }
    }
}

export { Pia as default };
