'use strict';

import AbstractCartridge = require('./AbstractCartridge');

class Cartridge4k extends AbstractCartridge {

    constructor (buffer?: {[i: number]: number}) {
        super();

        if (typeof(buffer) !== 'undefined') {
            for (var i = 0; i < 0x1000; i++) this.rom[i] = buffer[i];
        }
    }

    read(address: number): number {
        // Mask out A12 - A15
        return this.rom[address & 0x0FFF];
    }

    // A12 - A15 masked out -> 0x1000 bytes of ROM
    rom = new Uint8Array(0x1000);
}

export = Cartridge4k;
