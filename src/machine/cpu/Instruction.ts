'use strict';

class Instruction {
    constructor(
        public operation: Instruction.Operation,
        public addressingMode: Instruction.AddressingMode
    ) {}

    getSize(): number {
        switch (this.addressingMode) {
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
};

module Instruction {
    export const enum Operation {
        adc, and, asl, bcc, bcs, beq, bit, bmi, bne, bpl, brk, bvc, bvs, clc,
        cld, cli, clv, cmp, cpx, cpy, dec, dex, dey, eor, inc, inx, iny, jmp,
        jsr, lda, ldx, ldy, lsr, nop, ora, pha, php, pla, plp, rol, ror, rti,
        rts, sbc, sec, sed, sei, sta, stx, sty, tax, tay, tsx, txa, txs, tya,
        invalid
    };

    export enum OperationMap {
        adc, and, asl, bcc, bcs, beq, bit, bmi, bne, bpl, brk, bvc, bvs, clc,
        cld, cli, clv, cmp, cpx, cpy, dec, dex, dey, eor, inc, inx, iny, jmp,
        jsr, lda, ldx, ldy, lsr, nop, ora, pha, php, pla, plp, rol, ror, rti,
        rts, sbc, sec, sed, sei, sta, stx, sty, tax, tay, tsx, txa, txs, tya,
        invalid
    };

    export const enum AddressingMode {
        implied,
        immediate, zeroPage, absolute, indirect, relative,
        zeroPageX, absoluteX, indexedIndirectX,
        zeroPageY, absoluteY, indirectIndexedY,
        invalid
    };

    export var opcodes = new Array<Instruction>(256);
};

export = Instruction;

// Opcodes init

module Instruction {
    (function() {
        for (var i = 0; i < 256; i++) {
            opcodes[i] = new Instruction(Operation.invalid, AddressingMode.invalid);
        }
    })();

    (function() {
        var operation: Operation,
            addressingMode: AddressingMode,
            opcode: number;

        for (var i = 0; i < 8; i++) {
            switch (i) {
                case 0: operation = Operation.ora; break;
                case 1: operation = Operation.and; break;
                case 2: operation = Operation.eor; break;
                case 3: operation = Operation.adc; break;
                case 4: operation = Operation.sta; break;
                case 5: operation = Operation.lda; break;
                case 6: operation = Operation.cmp; break;
                case 7: operation = Operation.sbc; break;
            };
            for (var j = 0; j < 8; j++) {
                switch (j) {
                    case 0: addressingMode = AddressingMode.indexedIndirectX; break;
                    case 1: addressingMode = AddressingMode.zeroPage; break;
                    case 2: addressingMode = AddressingMode.immediate; break;
                    case 3: addressingMode = AddressingMode.absolute; break;
                    case 4: addressingMode = AddressingMode.indirectIndexedY; break;
                    case 5: addressingMode = AddressingMode.zeroPageX; break;
                    case 6: addressingMode = AddressingMode.absoluteY; break;
                    case 7: addressingMode = AddressingMode.absoluteX; break;
                }

                if (operation === Operation.sta && addressingMode === AddressingMode.immediate)
                    addressingMode = AddressingMode.invalid;

                if (operation !== Operation.invalid && addressingMode !== AddressingMode.invalid) {
                    opcode = (i << 5) | (j << 2) | 1;
                    opcodes[opcode].operation = operation;
                    opcodes[opcode].addressingMode = addressingMode;
                }
            }
        }

        function set(opcode: number, operation: Operation, addressingMode: AddressingMode): void {
            opcodes[opcode].operation = operation;
            opcodes[opcode].addressingMode = addressingMode;
        }

        set(0x06, Operation.asl, AddressingMode.zeroPage);
        set(0x0A, Operation.asl, AddressingMode.implied);
        set(0x0E, Operation.asl, AddressingMode.absolute);
        set(0x16, Operation.asl, AddressingMode.zeroPageX);
        set(0x1E, Operation.asl, AddressingMode.absoluteX);

        set(0x26, Operation.rol, AddressingMode.zeroPage);
        set(0x2A, Operation.rol, AddressingMode.implied);
        set(0x2E, Operation.rol, AddressingMode.absolute);
        set(0x36, Operation.rol, AddressingMode.zeroPageX);
        set(0x3E, Operation.rol, AddressingMode.absoluteX);

        set(0x46, Operation.lsr, AddressingMode.zeroPage);
        set(0x4A, Operation.lsr, AddressingMode.implied);
        set(0x4E, Operation.lsr, AddressingMode.absolute);
        set(0x56, Operation.lsr, AddressingMode.zeroPageX);
        set(0x5E, Operation.lsr, AddressingMode.absoluteX);

        set(0x66, Operation.ror, AddressingMode.zeroPage);
        set(0x6A, Operation.ror, AddressingMode.implied);
        set(0x6E, Operation.ror, AddressingMode.absolute);
        set(0x76, Operation.ror, AddressingMode.zeroPageX);
        set(0x7E, Operation.ror, AddressingMode.absoluteX);

        set(0x86, Operation.stx, AddressingMode.zeroPage);
        set(0x8E, Operation.stx, AddressingMode.absolute);
        set(0x96, Operation.stx, AddressingMode.zeroPageY);

        set(0xA2, Operation.ldx, AddressingMode.immediate);
        set(0xA6, Operation.ldx, AddressingMode.zeroPage);
        set(0xAE, Operation.ldx, AddressingMode.absolute);
        set(0xB6, Operation.ldx, AddressingMode.zeroPageY);
        set(0xBE, Operation.ldx, AddressingMode.absoluteY);

        set(0xC6, Operation.dec, AddressingMode.zeroPage);
        set(0xCE, Operation.dec, AddressingMode.absolute);
        set(0xD6, Operation.dec, AddressingMode.zeroPageX);
        set(0xDE, Operation.dec, AddressingMode.absoluteX);

        set(0xE6, Operation.inc, AddressingMode.zeroPage);
        set(0xEE, Operation.inc, AddressingMode.absolute);
        set(0xF6, Operation.inc, AddressingMode.zeroPageX);
        set(0xFE, Operation.inc, AddressingMode.absoluteX);

        set(0x24, Operation.bit, AddressingMode.zeroPage);
        set(0x2C, Operation.bit, AddressingMode.absolute);

        set(0x4C, Operation.jmp, AddressingMode.absolute);
        set(0x6C, Operation.jmp, AddressingMode.indirect);

        set(0x84, Operation.sty, AddressingMode.zeroPage);
        set(0x8C, Operation.sty, AddressingMode.absolute);
        set(0x94, Operation.sty, AddressingMode.zeroPageX);

        set(0xA0, Operation.ldy, AddressingMode.immediate);
        set(0xA4, Operation.ldy, AddressingMode.zeroPage);
        set(0xAC, Operation.ldy, AddressingMode.absolute);
        set(0xB4, Operation.ldy, AddressingMode.zeroPageX);
        set(0xBC, Operation.ldy, AddressingMode.absoluteX);

        set(0xC0, Operation.cpy, AddressingMode.immediate);
        set(0xC4, Operation.cpy, AddressingMode.zeroPage);
        set(0xCC, Operation.cpy, AddressingMode.absolute);

        set(0xE0, Operation.cpx, AddressingMode.immediate);
        set(0xE4, Operation.cpx, AddressingMode.zeroPage);
        set(0xEC, Operation.cpx, AddressingMode.absolute);

        set(0x10, Operation.bpl, AddressingMode.relative);
        set(0x30, Operation.bmi, AddressingMode.relative);
        set(0x50, Operation.bvc, AddressingMode.relative);
        set(0x70, Operation.bvs, AddressingMode.relative);
        set(0x90, Operation.bcc, AddressingMode.relative);
        set(0xB0, Operation.bcs, AddressingMode.relative);
        set(0xD0, Operation.bne, AddressingMode.relative);
        set(0xF0, Operation.beq, AddressingMode.relative);

        set(0x00, Operation.brk, AddressingMode.implied);
        set(0x20, Operation.jsr, AddressingMode.absolute);
        set(0x40, Operation.rti, AddressingMode.implied);
        set(0x60, Operation.rts, AddressingMode.implied);
        set(0x08, Operation.php, AddressingMode.implied);
        set(0x28, Operation.plp, AddressingMode.implied);
        set(0x48, Operation.pha, AddressingMode.implied);
        set(0x68, Operation.pla, AddressingMode.implied);
        set(0x88, Operation.dey, AddressingMode.implied);
        set(0xA8, Operation.tay, AddressingMode.implied);
        set(0xC8, Operation.iny, AddressingMode.implied);
        set(0xE8, Operation.inx, AddressingMode.implied);
        set(0x18, Operation.clc, AddressingMode.implied);
        set(0x38, Operation.sec, AddressingMode.implied);
        set(0x58, Operation.cli, AddressingMode.implied);
        set(0x78, Operation.sei, AddressingMode.implied);
        set(0x98, Operation.tya, AddressingMode.implied);
        set(0xB8, Operation.clv, AddressingMode.implied);
        set(0xD8, Operation.cld, AddressingMode.implied);
        set(0xF8, Operation.sed, AddressingMode.implied);
        set(0x8A, Operation.txa, AddressingMode.implied);
        set(0x9A, Operation.txs, AddressingMode.implied);
        set(0xAA, Operation.tax, AddressingMode.implied);
        set(0xBA, Operation.tsx, AddressingMode.implied);
        set(0xCA, Operation.dex, AddressingMode.implied);
        set(0xEA, Operation.nop, AddressingMode.implied);
    })();
};
