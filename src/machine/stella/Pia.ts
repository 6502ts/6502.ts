import Event = require('../../tools/event/Event');

class Pia {

    reset(): void {
        for (let i = 0; i < 128; i++) this.ram[i] = 0;
    }

    read(address: number): number {
        // RAM select = A9 low?
        if (address & 0x0200) {
            return 0;
        } else {
            // Mask out A7 - A15
            return this.ram[address & 0x7F];
        }
    }

    write(address: number, value: number) {
        // RAM select = A9 low?
        if (address & 0x0200) {
        } else {
            // Mask out A7 - A15
            this.ram[address & 0x7F] = value;
        }
    }

    cycle(): void {}

    trap = new Event<Pia.TrapPayload>();

    ram = new Uint8Array(128);
}

module Pia {
    export const enum Registers {
        swcha   = 0x280,
        swacnt  = 0x281,
        swchb   = 0x282,
        swncnt  = 0x283,
        intim   = 0x284,
        instat  = 0x285,
        tim1t   = 0x294,
        tim8t   = 0x295,
        tim64t  = 0x296,
        t1024t  = 0x297
    }

    export const enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor (
            public reason: TrapReason,
            public pia: Pia,
            public message?: string
        ) {}
    }
}

export = Pia;
