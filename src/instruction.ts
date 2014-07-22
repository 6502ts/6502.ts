class Instruction {
    constructor(
        public opcode: Instruction.Opcode,
        public adressingMode: Instruction.AdressingMode
    ) {}
};

module Instruction {
    export enum Opcode {
        adc, and, asl, bcc, bcs, beq, bit, bmi, bne, bpl, brk, bvc, bvs, clc,
        cld, cli, clv, cmp, cpx, cpy, dec, dex, dey, eor, inc, inx, iny, jmp,
        jsr, lda, ldx, ldy, lsr, nop, ora, pha, php, pla, plp, rol, ror, rti,
        rts, sbc, sec, sed, sei, sta, stx, sty, tax, tay, tsx, txa, txs, tya,
        invalid
    };

    export enum AdressingMode {
        implied,
        immediate, zeroPage, absolute, indirect,
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
            encodings[i] = new Instruction(Opcode.invalid, AdressingMode.invalid);
        }
    })();

    (function() {
        var opcode: Opcode,
            adressingMode: AdressingMode,
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
                    case 0: adressingMode = AdressingMode.indexedIndirectX; break;
                    case 1: adressingMode = AdressingMode.zeroPage; break;
                    case 2: adressingMode = AdressingMode.immediate; break;
                    case 3: adressingMode = AdressingMode.absolute; break;
                    case 4: adressingMode = AdressingMode.indirectIndexedY; break;
                    case 5: adressingMode = AdressingMode.zeroPageX; break;
                    case 6: adressingMode = AdressingMode.absoluteY; break;
                    case 7: adressingMode = AdressingMode.absoluteX; break;
                }
            }

            if (opcode === Opcode.sta && adressingMode === AdressingMode.immediate)
                opcode = Opcode.invalid;

            if (opcode !== Opcode.invalid && adressingMode !== AdressingMode.invalid) {
                encoding = (i << 5) & (j << 2) & 1;
                encodings[encoding].opcode = opcode;
                encodings[encoding].adressingMode = adressingMode;
            }
        }

        function set(encoding: number, opcode: Opcode, adressingMode: AdressingMode): void {
            encodings[encoding].opcode = opcode;
            encodings[encoding].adressingMode = adressingMode; 
        }

        set(0x06, Opcode.asl, AdressingMode.zeroPage);
        set(0x0A, Opcode.asl, AdressingMode.implied);
        set(0x0E, Opcode.asl, AdressingMode.absolute);
        set(0x16, Opcode.asl, AdressingMode.zeroPageX);
        set(0x1E, Opcode.asl, AdressingMode.absoluteX);
        
        set(0x26, Opcode.rol, AdressingMode.zeroPage);
        set(0x2A, Opcode.rol, AdressingMode.implied);
        set(0x2E, Opcode.rol, AdressingMode.absolute);
        set(0x36, Opcode.rol, AdressingMode.zeroPageX);
        set(0x3E, Opcode.rol, AdressingMode.absoluteX);

        set(0x46, Opcode.lsr, AdressingMode.zeroPage);
        set(0x4A, Opcode.lsr, AdressingMode.implied);
        set(0x4E, Opcode.lsr, AdressingMode.absolute);
        set(0x56, Opcode.lsr, AdressingMode.zeroPageX);
        set(0x5E, Opcode.lsr, AdressingMode.absoluteX);

        set(0x66, Opcode.ror, AdressingMode.zeroPage);
        set(0x6A, Opcode.ror, AdressingMode.implied);
        set(0x6E, Opcode.ror, AdressingMode.absolute);
        set(0x76, Opcode.ror, AdressingMode.zeroPageX);
        set(0x7E, Opcode.ror, AdressingMode.absoluteX);

        set(0x86, Opcode.stx, AdressingMode.zeroPage);
        set(0x8E, Opcode.stx, AdressingMode.absolute);
        set(0x96, Opcode.stx, AdressingMode.zeroPageY);

        set(0xA2, Opcode.ldx, AdressingMode.immediate);
        set(0xA6, Opcode.ldx, AdressingMode.zeroPage);
        set(0xAE, Opcode.ldx, AdressingMode.absolute);
        set(0xB6, Opcode.ldx, AdressingMode.zeroPageY);
        set(0xBE, Opcode.ldx, AdressingMode.absoluteY);

        set(0xC6, Opcode.dec, AdressingMode.zeroPage);
        set(0xCE, Opcode.dec, AdressingMode.absolute);
        set(0xD6, Opcode.dec, AdressingMode.zeroPageX);
        set(0xDE, Opcode.dec, AdressingMode.absoluteX);

        set(0xE6, Opcode.inc, AdressingMode.zeroPage);
        set(0xEE, Opcode.inc, AdressingMode.absolute);
        set(0xF6, Opcode.inc, AdressingMode.zeroPageX);
        set(0xFE, Opcode.inc, AdressingMode.absoluteX);

        set(0x24, Opcode.bit, AdressingMode.zeroPage);
        set(0x2C, Opcode.bit, AdressingMode.absolute);

        set(0x4C, Opcode.jmp, AdressingMode.absolute);
        set(0x6C, Opcode.jmp, AdressingMode.indirect);

        set(0x84, Opcode.sty, AdressingMode.zeroPage);
        set(0x8C, Opcode.sty, AdressingMode.absolute);
        set(0x94, Opcode.sty, AdressingMode.zeroPageX);

        set(0xA0, Opcode.ldy, AdressingMode.immediate);
        set(0xA4, Opcode.ldy, AdressingMode.zeroPage);
        set(0xAC, Opcode.ldy, AdressingMode.absolute);
        set(0xB4, Opcode.ldy, AdressingMode.zeroPageX);
        set(0xBC, Opcode.ldy, AdressingMode.absoluteX);

        set(0xC0, Opcode.cpx, AdressingMode.immediate);
        set(0xC4, Opcode.cpx, AdressingMode.zeroPage);
        set(0xCC, Opcode.cpx, AdressingMode.absolute);

        set(0xE0, Opcode.cpy, AdressingMode.immediate);
        set(0xE4, Opcode.cpy, AdressingMode.zeroPage);
        set(0xEC, Opcode.cpy, AdressingMode.absolute);

        set(0x10, Opcode.bpl, AdressingMode.implied);
        set(0x30, Opcode.bmi, AdressingMode.implied);
        set(0x50, Opcode.bvc, AdressingMode.implied);
        set(0x70, Opcode.bvs, AdressingMode.implied);
        set(0x90, Opcode.bcc, AdressingMode.implied);
        set(0xB0, Opcode.bcs, AdressingMode.implied);
        set(0xD0, Opcode.bne, AdressingMode.implied);
        set(0xF0, Opcode.beq, AdressingMode.implied);

        set(0x00, Opcode.brk, AdressingMode.implied);
        set(0x20, Opcode.jsr, AdressingMode.absolute);
        set(0x40, Opcode.rti, AdressingMode.implied);
        set(0x60, Opcode.rts, AdressingMode.implied);
        set(0x08, Opcode.php, AdressingMode.implied);
        set(0x28, Opcode.plp, AdressingMode.implied);
        set(0x58, Opcode.pha, AdressingMode.implied);
        set(0x68, Opcode.pla, AdressingMode.implied);
        set(0x88, Opcode.dey, AdressingMode.implied);
        set(0xA8, Opcode.tay, AdressingMode.implied);
        set(0xC8, Opcode.iny, AdressingMode.implied);
        set(0xE8, Opcode.inx, AdressingMode.implied);
        set(0x18, Opcode.clc, AdressingMode.implied);
        set(0x38, Opcode.sec, AdressingMode.implied);
        set(0x58, Opcode.cli, AdressingMode.implied);
        set(0x78, Opcode.sei, AdressingMode.implied);
        set(0x98, Opcode.tya, AdressingMode.implied);
        set(0xB9, Opcode.clv, AdressingMode.implied);
        set(0xD8, Opcode.cld, AdressingMode.implied);
        set(0xF8, Opcode.sed, AdressingMode.implied);
        set(0x8A, Opcode.txa, AdressingMode.implied);
        set(0x9A, Opcode.txs, AdressingMode.implied);
        set(0xAA, Opcode.tax, AdressingMode.implied);
        set(0xBA, Opcode.tsx, AdressingMode.implied);
        set(0xCA, Opcode.dex, AdressingMode.implied);
        set(0xEA, Opcode.nop, AdressingMode.implied);
    })();
};
