'use strict';

import Event = require('../../tools/event/Event');

class Pia {

    read(address: number): number

    write(address: number, value: number) {
    }

    tick(): void {}

    trap = new Event<Pia.TrapPayload>();
}

module Pia {
    export enum Registers {
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

    export enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor (
            public reason: TrapReason,
            public pia: Pia,
            public message?: string
        ) {}
    }
}

export = Pia;
