'use strict';

import BusInterface = require('./BusInterface');

class SimpleMemory implements BusInterface {
    constructor() {
        this.clear();
    }

    clear(): void {
        for (var i = 0; i < 0x10000; i++) this._data[i] = 0;
    }

    read(address: number): number {
        return this._data[address];
    }

    readWord(address: number): number {
        return this._data[address] + (this._data[(address+1) & 0xFFFF] << 8);
    }

    write(address: number, value: number) {
        this._data[address] = value;
    }

    peek(address: number): number {
        return this._data[address];
    }

    poke(address: number, value: number) {
        this._data[address] = value;
    }

    _data = new Uint8Array(0x10000);
}

export = SimpleMemory;
