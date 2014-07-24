class Instruction {
    constructor(
        public opcode: Instruction.Opcode,
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
    export enum Opcode {
        adc, and, asl, bcc, bcs, beq, bit, bmi, bne, bpl, brk, bvc, bvs, clc,
        cld, cli, clv, cmp, cpx, cpy, dec, dex, dey, eor, inc, inx, iny, jmp,
        jsr, lda, ldx, ldy, lsr, nop, ora, pha, php, pla, plp, rol, ror, rti,
        rts, sbc, sec, sed, sei, sta, stx, sty, tax, tay, tsx, txa, txs, tya,
        invalid
    };

    export enum AddressingMode {
        implied,
        immediate, zeroPage, absolute, indirect, relative,
        zeroPageX, absoluteX, indexedIndirectX,
        zeroPageY, absoluteY, indirectIndexedY,
        invalid
    };

    export var encodings = new Array<Instruction>(256);
};

export = Instruction;

// Encoding init

module Instruction {
    (function() {
        for (var i = 0; i < 256; i++) {
            encodings[i] = new Instruction(Opcode.invalid, AddressingMode.invalid);
        }
    })();

    (function() {
        var opcode: Opcode,
            addressingMode: AddressingMode,
            encoding: number;

        for (var i = 0; i < 8; i++) {
            switch (i) {
                case 0: opcode = Opcode.ora; break;
                case 1: opcode = Opcode.and; break;
                case 2: opcode = Opcode.eor; break;
                case 3: opcode = Opcode.adc; break;
                case 4: opcode = Opcode.sta; break;
                case 5: opcode = Opcode.lda; break;
                case 6: opcode = Opcode.cmp; break;
                case 7: opcode = Opcode.sbc; break;
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

                if (opcode === Opcode.sta && addressingMode === AddressingMode.immediate)
                    addressingMode = AddressingMode.invalid;

                if (opcode !== Opcode.invalid && addressingMode !== AddressingMode.invalid) {
                    encoding = (i << 5) | (j << 2) | 1;
                    encodings[encoding].opcode = opcode;
                    encodings[encoding].addressingMode = addressingMode;
                }
            }
        }

        function set(encoding: number, opcode: Opcode, addressingMode: AddressingMode): void {
            encodings[encoding].opcode = opcode;
            encodings[encoding].addressingMode = addressingMode; 
        }

        set(0x06, Opcode.asl, AddressingMode.zeroPage);
        set(0x0A, Opcode.asl, AddressingMode.implied);
        set(0x0E, Opcode.asl, AddressingMode.absolute);
        set(0x16, Opcode.asl, AddressingMode.zeroPageX);
        set(0x1E, Opcode.asl, AddressingMode.absoluteX);
        
        set(0x26, Opcode.rol, AddressingMode.zeroPage);
        set(0x2A, Opcode.rol, AddressingMode.implied);
        set(0x2E, Opcode.rol, AddressingMode.absolute);
        set(0x36, Opcode.rol, AddressingMode.zeroPageX);
        set(0x3E, Opcode.rol, AddressingMode.absoluteX);

        set(0x46, Opcode.lsr, AddressingMode.zeroPage);
        set(0x4A, Opcode.lsr, AddressingMode.implied);
        set(0x4E, Opcode.lsr, AddressingMode.absolute);
        set(0x56, Opcode.lsr, AddressingMode.zeroPageX);
        set(0x5E, Opcode.lsr, AddressingMode.absoluteX);

        set(0x66, Opcode.ror, AddressingMode.zeroPage);
        set(0x6A, Opcode.ror, AddressingMode.implied);
        set(0x6E, Opcode.ror, AddressingMode.absolute);
        set(0x76, Opcode.ror, AddressingMode.zeroPageX);
        set(0x7E, Opcode.ror, AddressingMode.absoluteX);

        set(0x86, Opcode.stx, AddressingMode.zeroPage);
        set(0x8E, Opcode.stx, AddressingMode.absolute);
        set(0x96, Opcode.stx, AddressingMode.zeroPageY);

        set(0xA2, Opcode.ldx, AddressingMode.immediate);
        set(0xA6, Opcode.ldx, AddressingMode.zeroPage);
        set(0xAE, Opcode.ldx, AddressingMode.absolute);
        set(0xB6, Opcode.ldx, AddressingMode.zeroPageY);
        set(0xBE, Opcode.ldx, AddressingMode.absoluteY);

        set(0xC6, Opcode.dec, AddressingMode.zeroPage);
        set(0xCE, Opcode.dec, AddressingMode.absolute);
        set(0xD6, Opcode.dec, AddressingMode.zeroPageX);
        set(0xDE, Opcode.dec, AddressingMode.absoluteX);

        set(0xE6, Opcode.inc, AddressingMode.zeroPage);
        set(0xEE, Opcode.inc, AddressingMode.absolute);
        set(0xF6, Opcode.inc, AddressingMode.zeroPageX);
        set(0xFE, Opcode.inc, AddressingMode.absoluteX);

        set(0x24, Opcode.bit, AddressingMode.zeroPage);
        set(0x2C, Opcode.bit, AddressingMode.absolute);

        set(0x4C, Opcode.jmp, AddressingMode.absolute);
        set(0x6C, Opcode.jmp, AddressingMode.indirect);

        set(0x84, Opcode.sty, AddressingMode.zeroPage);
        set(0x8C, Opcode.sty, AddressingMode.absolute);
        set(0x94, Opcode.sty, AddressingMode.zeroPageX);

        set(0xA0, Opcode.ldy, AddressingMode.immediate);
        set(0xA4, Opcode.ldy, AddressingMode.zeroPage);
        set(0xAC, Opcode.ldy, AddressingMode.absolute);
        set(0xB4, Opcode.ldy, AddressingMode.zeroPageX);
        set(0xBC, Opcode.ldy, AddressingMode.absoluteX);

        set(0xC0, Opcode.cpx, AddressingMode.immediate);
        set(0xC4, Opcode.cpx, AddressingMode.zeroPage);
        set(0xCC, Opcode.cpx, AddressingMode.absolute);

        set(0xE0, Opcode.cpy, AddressingMode.immediate);
        set(0xE4, Opcode.cpy, AddressingMode.zeroPage);
        set(0xEC, Opcode.cpy, AddressingMode.absolute);

        set(0x10, Opcode.bpl, AddressingMode.relative);
        set(0x30, Opcode.bmi, AddressingMode.relative);
        set(0x50, Opcode.bvc, AddressingMode.relative);
        set(0x70, Opcode.bvs, AddressingMode.relative);
        set(0x90, Opcode.bcc, AddressingMode.relative);
        set(0xB0, Opcode.bcs, AddressingMode.relative);
        set(0xD0, Opcode.bne, AddressingMode.relative);
        set(0xF0, Opcode.beq, AddressingMode.relative);

        set(0x00, Opcode.brk, AddressingMode.implied);
        set(0x20, Opcode.jsr, AddressingMode.absolute);
        set(0x40, Opcode.rti, AddressingMode.implied);
        set(0x60, Opcode.rts, AddressingMode.implied);
        set(0x08, Opcode.php, AddressingMode.implied);
        set(0x28, Opcode.plp, AddressingMode.implied);
        set(0x58, Opcode.pha, AddressingMode.implied);
        set(0x68, Opcode.pla, AddressingMode.implied);
        set(0x88, Opcode.dey, AddressingMode.implied);
        set(0xA8, Opcode.tay, AddressingMode.implied);
        set(0xC8, Opcode.iny, AddressingMode.implied);
        set(0xE8, Opcode.inx, AddressingMode.implied);
        set(0x18, Opcode.clc, AddressingMode.implied);
        set(0x38, Opcode.sec, AddressingMode.implied);
        set(0x58, Opcode.cli, AddressingMode.implied);
        set(0x78, Opcode.sei, AddressingMode.implied);
        set(0x98, Opcode.tya, AddressingMode.implied);
        set(0xB8, Opcode.clv, AddressingMode.implied);
        set(0xD8, Opcode.cld, AddressingMode.implied);
        set(0xF8, Opcode.sed, AddressingMode.implied);
        set(0x8A, Opcode.txa, AddressingMode.implied);
        set(0x9A, Opcode.txs, AddressingMode.implied);
        set(0xAA, Opcode.tax, AddressingMode.implied);
        set(0xBA, Opcode.tsx, AddressingMode.implied);
        set(0xCA, Opcode.dex, AddressingMode.implied);
        set(0xEA, Opcode.nop, AddressingMode.implied);
    })();
};
