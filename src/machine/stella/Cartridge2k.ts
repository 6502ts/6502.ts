'use strict';

import AbstractCartridge = require('./AbstractCartridge');

class Cartridge2k extends AbstractCartridge {

    constructor (buffer?: {[i: number]: number}) {
        super();

        if (typeof(buffer) !== 'undefined') {
            for (var i = 0; i < 0x8000; i++) this.rom[i] = buffer[i];
        }
    }

    read(address: number): number {
        // Mask out A11 - A15
        return this.rom[address & 0x07FF];
    }

    // A11 - A15 masked out -> 0x0800 bytes of ROM
    rom = new Uint8Array(0x0800);
}

export = Cartridge2k;
