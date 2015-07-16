'use strict';

import Event = require('../../tools/event/Event');

class Cartridge {

    read(address: number): number

    write(address: number, value: number) {
    }

    trap = new Event<Cartridge.TrapPayload>();

}

module Cartridge {

    export enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public cartridge: Cartridge,
            public message?: string
        ) {}
    }

}

export = Cartridge;
