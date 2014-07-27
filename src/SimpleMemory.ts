/// <reference path='./MemoryInterface.ts'/>

'use strict';

class SimpleMemory implements MemoryInterface {
    constructor() {
        for (var i = 0; i < 0x10000; i++) this._data[i] = 0;
    }

    read(address: number): number {
        return this._data[address];
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

    private _data = new Uint8Array(0x10000);
}

export = SimpleMemory;
