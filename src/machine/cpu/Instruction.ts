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

class Instruction {
    constructor(
        public readonly operation: Instruction.Operation,
        public readonly addressingMode: Instruction.AddressingMode,
        public readonly effectiveAddressingMode = addressingMode
    ) {}

    getSize(): number {
        switch (this.effectiveAddressingMode) {
            case Instruction.AddressingMode.immediate:
            case Instruction.AddressingMode.zeroPage:
            case Instruction.AddressingMode.zeroPageX:
            case Instruction.AddressingMode.zeroPageY:
            case Instruction.AddressingMode.indexedIndirectX:
            case Instruction.AddressingMode.indirectIndexedY:
            case Instruction.AddressingMode.relative:
                return 2;

            case Instruction.AddressingMode.absolute:
            case Instruction.AddressingMode.absoluteX:
            case Instruction.AddressingMode.absoluteY:
            case Instruction.AddressingMode.indirect:
                return 3;

            default:
                return 1;
        }
    }
}

namespace Instruction {
    export const enum Operation {
        adc,
        and,
        asl,
        bcc,
        bcs,
        beq,
        bit,
        bmi,
        bne,
        bpl,
        brk,
        bvc,
        bvs,
        clc,
        cld,
        cli,
        clv,
        cmp,
        cpx,
        cpy,
        dec,
        dex,
        dey,
        eor,
        inc,
        inx,
        iny,
        jmp,
        jsr,
        lda,
        ldx,
        ldy,
        lsr,
        nop,
        ora,
        pha,
        php,
        pla,
        plp,
        rol,
        ror,
        rti,
        rts,
        sbc,
        sec,
        sed,
        sei,
        sta,
        stx,
        sty,
        tax,
        tay,
        tsx,
        txa,
        txs,
        tya,
        // undocumented operations
        dop,
        top,
        alr,
        axs,
        dcp,
        lax,
        arr,
        slo,
        aax,
        lar,
        isc,
        aac,
        atx,
        rra,
        rla,
        invalid
    }

    export enum OperationMap {
        adc,
        and,
        asl,
        bcc,
        bcs,
        beq,
        bit,
        bmi,
        bne,
        bpl,
        brk,
        bvc,
        bvs,
        clc,
        cld,
        cli,
        clv,
        cmp,
        cpx,
        cpy,
        dec,
        dex,
        dey,
        eor,
        inc,
        inx,
        iny,
        jmp,
        jsr,
        lda,
        ldx,
        ldy,
        lsr,
        nop,
        ora,
        pha,
        php,
        pla,
        plp,
        rol,
        ror,
        rti,
        rts,
        sbc,
        sec,
        sed,
        sei,
        sta,
        stx,
        sty,
        tax,
        tay,
        tsx,
        txa,
        txs,
        tya,
        // undocumented operations
        dop,
        top,
        alr,
        axs,
        dcp,
        lax,
        arr,
        slo,
        aax,
        lar,
        isc,
        aac,
        atx,
        rra,
        rla,
        invalid
    }

    export const enum AddressingMode {
        implied,
        immediate,
        zeroPage,
        absolute,
        indirect,
        relative,
        zeroPageX,
        absoluteX,
        indexedIndirectX,
        zeroPageY,
        absoluteY,
        indirectIndexedY,
        invalid
    }

    export const opcodes = new Array<Instruction>(256);
}

export { Instruction as default };

// Opcodes init

namespace Instruction {
    export namespace __init {
        for (let i = 0; i < 256; i++) {
            opcodes[i] = new Instruction(Operation.invalid, AddressingMode.invalid);
        }

        let operation: Operation, addressingMode: AddressingMode, opcode: number;

        for (let i = 0; i < 8; i++) {
            switch (i) {
                case 0:
                    operation = Operation.ora;
                    break;
                case 1:
                    operation = Operation.and;
                    break;
                case 2:
                    operation = Operation.eor;
                    break;
                case 3:
                    operation = Operation.adc;
                    break;
                case 4:
                    operation = Operation.sta;
                    break;
                case 5:
                    operation = Operation.lda;
                    break;
                case 6:
                    operation = Operation.cmp;
                    break;
                case 7:
                    operation = Operation.sbc;
                    break;
            }
            for (let j = 0; j < 8; j++) {
                switch (j) {
                    case 0:
                        addressingMode = AddressingMode.indexedIndirectX;
                        break;
                    case 1:
                        addressingMode = AddressingMode.zeroPage;
                        break;
                    case 2:
                        addressingMode = AddressingMode.immediate;
                        break;
                    case 3:
                        addressingMode = AddressingMode.absolute;
                        break;
                    case 4:
                        addressingMode = AddressingMode.indirectIndexedY;
                        break;
                    case 5:
                        addressingMode = AddressingMode.zeroPageX;
                        break;
                    case 6:
                        addressingMode = AddressingMode.absoluteY;
                        break;
                    case 7:
                        addressingMode = AddressingMode.absoluteX;
                        break;
                }

                if (operation === Operation.sta && addressingMode === AddressingMode.immediate) {
                    addressingMode = AddressingMode.invalid;
                }

                if (operation !== Operation.invalid && addressingMode !== AddressingMode.invalid) {
                    opcode = (i << 5) | (j << 2) | 1;
                    opcodes[opcode] = new Instruction(operation, addressingMode);
                }
            }
        }

        function set(
            _opcode: number,
            _operation: Operation,
            _addressingMode: AddressingMode,
            _effectiveAdressingMode?: AddressingMode
        ): void {
            if (opcodes[_opcode].operation !== Operation.invalid) {
                throw new Error('entry for opcode ' + _opcode + ' already exists');
            }

            opcodes[_opcode] = new Instruction(_operation, _addressingMode, _effectiveAdressingMode);
        }

        set(0x06, Operation.asl, AddressingMode.zeroPage);
        set(0x0a, Operation.asl, AddressingMode.implied);
        set(0x0e, Operation.asl, AddressingMode.absolute);
        set(0x16, Operation.asl, AddressingMode.zeroPageX);
        set(0x1e, Operation.asl, AddressingMode.absoluteX);

        set(0x26, Operation.rol, AddressingMode.zeroPage);
        set(0x2a, Operation.rol, AddressingMode.implied);
        set(0x2e, Operation.rol, AddressingMode.absolute);
        set(0x36, Operation.rol, AddressingMode.zeroPageX);
        set(0x3e, Operation.rol, AddressingMode.absoluteX);

        set(0x46, Operation.lsr, AddressingMode.zeroPage);
        set(0x4a, Operation.lsr, AddressingMode.implied);
        set(0x4e, Operation.lsr, AddressingMode.absolute);
        set(0x56, Operation.lsr, AddressingMode.zeroPageX);
        set(0x5e, Operation.lsr, AddressingMode.absoluteX);

        set(0x66, Operation.ror, AddressingMode.zeroPage);
        set(0x6a, Operation.ror, AddressingMode.implied);
        set(0x6e, Operation.ror, AddressingMode.absolute);
        set(0x76, Operation.ror, AddressingMode.zeroPageX);
        set(0x7e, Operation.ror, AddressingMode.absoluteX);

        set(0x86, Operation.stx, AddressingMode.zeroPage);
        set(0x8e, Operation.stx, AddressingMode.absolute);
        set(0x96, Operation.stx, AddressingMode.zeroPageY);

        set(0xa2, Operation.ldx, AddressingMode.immediate);
        set(0xa6, Operation.ldx, AddressingMode.zeroPage);
        set(0xae, Operation.ldx, AddressingMode.absolute);
        set(0xb6, Operation.ldx, AddressingMode.zeroPageY);
        set(0xbe, Operation.ldx, AddressingMode.absoluteY);

        set(0xc6, Operation.dec, AddressingMode.zeroPage);
        set(0xce, Operation.dec, AddressingMode.absolute);
        set(0xd6, Operation.dec, AddressingMode.zeroPageX);
        set(0xde, Operation.dec, AddressingMode.absoluteX);

        set(0xe6, Operation.inc, AddressingMode.zeroPage);
        set(0xee, Operation.inc, AddressingMode.absolute);
        set(0xf6, Operation.inc, AddressingMode.zeroPageX);
        set(0xfe, Operation.inc, AddressingMode.absoluteX);

        set(0x24, Operation.bit, AddressingMode.zeroPage);
        set(0x2c, Operation.bit, AddressingMode.absolute);

        set(0x4c, Operation.jmp, AddressingMode.absolute);
        set(0x6c, Operation.jmp, AddressingMode.indirect);

        set(0x84, Operation.sty, AddressingMode.zeroPage);
        set(0x8c, Operation.sty, AddressingMode.absolute);
        set(0x94, Operation.sty, AddressingMode.zeroPageX);

        set(0xa0, Operation.ldy, AddressingMode.immediate);
        set(0xa4, Operation.ldy, AddressingMode.zeroPage);
        set(0xac, Operation.ldy, AddressingMode.absolute);
        set(0xb4, Operation.ldy, AddressingMode.zeroPageX);
        set(0xbc, Operation.ldy, AddressingMode.absoluteX);

        set(0xc0, Operation.cpy, AddressingMode.immediate);
        set(0xc4, Operation.cpy, AddressingMode.zeroPage);
        set(0xcc, Operation.cpy, AddressingMode.absolute);

        set(0xe0, Operation.cpx, AddressingMode.immediate);
        set(0xe4, Operation.cpx, AddressingMode.zeroPage);
        set(0xec, Operation.cpx, AddressingMode.absolute);

        set(0x10, Operation.bpl, AddressingMode.relative);
        set(0x30, Operation.bmi, AddressingMode.relative);
        set(0x50, Operation.bvc, AddressingMode.relative);
        set(0x70, Operation.bvs, AddressingMode.relative);
        set(0x90, Operation.bcc, AddressingMode.relative);
        set(0xb0, Operation.bcs, AddressingMode.relative);
        set(0xd0, Operation.bne, AddressingMode.relative);
        set(0xf0, Operation.beq, AddressingMode.relative);

        set(0x00, Operation.brk, AddressingMode.implied);
        set(0x20, Operation.jsr, AddressingMode.implied, AddressingMode.absolute);
        set(0x40, Operation.rti, AddressingMode.implied);
        set(0x60, Operation.rts, AddressingMode.implied);
        set(0x08, Operation.php, AddressingMode.implied);
        set(0x28, Operation.plp, AddressingMode.implied);
        set(0x48, Operation.pha, AddressingMode.implied);
        set(0x68, Operation.pla, AddressingMode.implied);
        set(0x88, Operation.dey, AddressingMode.implied);
        set(0xa8, Operation.tay, AddressingMode.implied);
        set(0xc8, Operation.iny, AddressingMode.implied);
        set(0xe8, Operation.inx, AddressingMode.implied);
        set(0x18, Operation.clc, AddressingMode.implied);
        set(0x38, Operation.sec, AddressingMode.implied);
        set(0x58, Operation.cli, AddressingMode.implied);
        set(0x78, Operation.sei, AddressingMode.implied);
        set(0x98, Operation.tya, AddressingMode.implied);
        set(0xb8, Operation.clv, AddressingMode.implied);
        set(0xd8, Operation.cld, AddressingMode.implied);
        set(0xf8, Operation.sed, AddressingMode.implied);
        set(0x8a, Operation.txa, AddressingMode.implied);
        set(0x9a, Operation.txs, AddressingMode.implied);
        set(0xaa, Operation.tax, AddressingMode.implied);
        set(0xba, Operation.tsx, AddressingMode.implied);
        set(0xca, Operation.dex, AddressingMode.implied);
        set(0xea, Operation.nop, AddressingMode.implied);

        // instructions for undocumented opcodes
        set(0x1a, Operation.nop, AddressingMode.implied);
        set(0x3a, Operation.nop, AddressingMode.implied);
        set(0x5a, Operation.nop, AddressingMode.implied);
        set(0x7a, Operation.nop, AddressingMode.implied);
        set(0xda, Operation.nop, AddressingMode.implied);
        set(0xfa, Operation.nop, AddressingMode.implied);

        set(0x04, Operation.dop, AddressingMode.zeroPage);
        set(0x14, Operation.dop, AddressingMode.zeroPageX);
        set(0x34, Operation.dop, AddressingMode.zeroPageX);
        set(0x44, Operation.dop, AddressingMode.zeroPage);
        set(0x54, Operation.dop, AddressingMode.zeroPageX);
        set(0x64, Operation.dop, AddressingMode.zeroPage);
        set(0x74, Operation.dop, AddressingMode.zeroPageX);
        set(0x80, Operation.dop, AddressingMode.immediate);
        set(0x82, Operation.dop, AddressingMode.immediate);
        set(0x89, Operation.dop, AddressingMode.immediate);
        set(0xc2, Operation.dop, AddressingMode.immediate);
        set(0xd4, Operation.dop, AddressingMode.zeroPageX);
        set(0xe2, Operation.dop, AddressingMode.immediate);
        set(0xf4, Operation.dop, AddressingMode.zeroPageX);

        set(0x0c, Operation.top, AddressingMode.absolute);
        set(0x1c, Operation.top, AddressingMode.absoluteX);
        set(0x3c, Operation.top, AddressingMode.absoluteX);
        set(0x5c, Operation.top, AddressingMode.absoluteX);
        set(0x7c, Operation.top, AddressingMode.absoluteX);
        set(0xdc, Operation.top, AddressingMode.absoluteX);
        set(0xfc, Operation.top, AddressingMode.absoluteX);

        set(0xeb, Operation.sbc, AddressingMode.immediate);

        set(0x4b, Operation.alr, AddressingMode.immediate);

        set(0xcb, Operation.axs, AddressingMode.immediate);

        set(0xc7, Operation.dcp, AddressingMode.zeroPage);
        set(0xd7, Operation.dcp, AddressingMode.zeroPageX);
        set(0xcf, Operation.dcp, AddressingMode.absolute);
        set(0xdf, Operation.dcp, AddressingMode.absoluteX);
        set(0xdb, Operation.dcp, AddressingMode.absoluteY);
        set(0xc3, Operation.dcp, AddressingMode.indexedIndirectX);
        set(0xd3, Operation.dcp, AddressingMode.indirectIndexedY);

        set(0xa7, Operation.lax, AddressingMode.zeroPage);
        set(0xb7, Operation.lax, AddressingMode.zeroPageY);
        set(0xaf, Operation.lax, AddressingMode.absolute);
        set(0xbf, Operation.lax, AddressingMode.absoluteY);
        set(0xa3, Operation.lax, AddressingMode.indexedIndirectX);
        set(0xb3, Operation.lax, AddressingMode.indirectIndexedY);

        set(0x6b, Operation.arr, AddressingMode.immediate);

        set(0x07, Operation.slo, AddressingMode.zeroPage);
        set(0x17, Operation.slo, AddressingMode.zeroPageX);
        set(0x0f, Operation.slo, AddressingMode.absolute);
        set(0x1f, Operation.slo, AddressingMode.absoluteX);
        set(0x1b, Operation.slo, AddressingMode.absoluteY);
        set(0x03, Operation.slo, AddressingMode.indexedIndirectX);
        set(0x13, Operation.slo, AddressingMode.indirectIndexedY);

        set(0x87, Operation.aax, AddressingMode.zeroPage);
        set(0x97, Operation.aax, AddressingMode.zeroPageY);
        set(0x83, Operation.aax, AddressingMode.indexedIndirectX);
        set(0x8f, Operation.aax, AddressingMode.absolute);

        set(0xbb, Operation.lar, AddressingMode.absoluteY);

        set(0xe7, Operation.isc, AddressingMode.zeroPage);
        set(0xf7, Operation.isc, AddressingMode.zeroPageX);
        set(0xef, Operation.isc, AddressingMode.absolute);
        set(0xff, Operation.isc, AddressingMode.absoluteX);
        set(0xfb, Operation.isc, AddressingMode.absoluteY);
        set(0xe3, Operation.isc, AddressingMode.indexedIndirectX);
        set(0xf3, Operation.isc, AddressingMode.indirectIndexedY);

        set(0x0b, Operation.aac, AddressingMode.immediate);
        set(0x2b, Operation.aac, AddressingMode.immediate);

        set(0xab, Operation.atx, AddressingMode.immediate);

        set(0x67, Operation.rra, AddressingMode.zeroPage);
        set(0x77, Operation.rra, AddressingMode.zeroPageX);
        set(0x6f, Operation.rra, AddressingMode.absolute);
        set(0x7f, Operation.rra, AddressingMode.absoluteX);
        set(0x7b, Operation.rra, AddressingMode.absoluteY);
        set(0x63, Operation.rra, AddressingMode.indexedIndirectX);
        set(0x73, Operation.rra, AddressingMode.indirectIndexedY);

        set(0x27, Operation.rla, AddressingMode.zeroPage);
        set(0x37, Operation.rla, AddressingMode.zeroPageX);
        set(0x2f, Operation.rla, AddressingMode.absolute);
        set(0x3f, Operation.rla, AddressingMode.absoluteX);
        set(0x3b, Operation.rla, AddressingMode.absoluteY);
        set(0x23, Operation.rla, AddressingMode.indexedIndirectX);
        set(0x33, Operation.rla, AddressingMode.indirectIndexedY);
    }
}
