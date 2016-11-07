/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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


import AbstractCartridge from './AbstractCartridge';
import CpuInterface from '../../cpu/CpuInterface';
import BusInterface from '../../bus/BusInterface';
import CartridgeInfo from './CartridgeInfo';
import * as cartridgeUtil from './util';

class CartridgeFE extends AbstractCartridge {

    constructor (buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
        }

        this.reset();
    }

    reset(): void {
        this._bank = this._bank0;
    }

    read(address: number): number {
        return this._bank[address & 0x0FFF];
    }

    write(address: number, value: number): void {
        super.write(address, value);
    }

    setCpu(cpu: CpuInterface): this {
        this._cpu = cpu;

        return this;
    }

    setBus(bus: BusInterface): this {
        this._bus = bus;

        return this;
    }

    notifyCpuCycleComplete(): void {
        const lastInstruction = this._bus.peek(this._cpu.getLastInstructionPointer());

        if (
            lastInstruction === 0x20 || // JSR
            lastInstruction === 0x60    // RTS
        ) {
            this._bank = (this._cpu.state.p & 0x2000) > 0 ? this._bank0 : this._bank1;
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_FE;
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer,
            [
                [0x20, 0x00, 0xD0, 0xC6, 0xC5],  // JSR $D000; DEC $C5
                [0x20, 0xC3, 0xF8, 0xA5, 0x82],  // JSR $F8C3; LDA $82
                [0xD0, 0xFB, 0x20, 0x73, 0xFE],  // BNE $FB; JSR $FE73
                [0x20, 0x00, 0xF0, 0x84, 0xD6]   // JSR $F000; STY $D6
            ]
        );

        for (let i = 0; i < signatureCounts.length; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    private _cpu: CpuInterface;
    private _bus: BusInterface;

    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank: Uint8Array;

}

export default CartridgeFE;
