'use strict';

import SimpleMemory = require('./SimpleMemory');

class EhBasicMonitor extends SimpleMemory {
    read(address: number): number {
        if (address === 0xF004) {
            return this._readHandler();
        } else {
            return this._data[address];
        }
    }

    readWord(address: number): number {
        if ((address & 0xFFF0) === 0xF000) {
            return this.read(address) + this.read((address+1) % 0x10000) << 8;
        }

        return this._data[address] + (this._data[(address+1) % 0x10000] << 8);
    }

    write(address: number, value: number) {
        if (address === 0xF001) {
            this._writeHandler(value);
        } else if (address < 0xC000) {
            this._data[address] = value;
        }
    }

    setReadHandler(readHandler: EhBasicMonitor.ReadHandlerInterface): EhBasicMonitor {
        this._readHandler = readHandler;
        return this;
    }

    getReadHandler(): EhBasicMonitor.ReadHandlerInterface {
        return this._readHandler;
    }

    setWriteHandler(writeHandler: EhBasicMonitor.WriteHandlerInterface): EhBasicMonitor {
        this._writeHandler = writeHandler;
        return this;
    }

    getWriteHandler(): EhBasicMonitor.WriteHandlerInterface {
        return this._writeHandler;
    }

    private _readHandler: EhBasicMonitor.ReadHandlerInterface =
        (): number => 0x00;
    private _writeHandler: EhBasicMonitor.WriteHandlerInterface =
        (value: number): void => undefined;
}

module EhBasicMonitor {
    export interface ReadHandlerInterface {
        (): number;
    }

    export interface WriteHandlerInterface {
        (value: number): void;
    }
}

export = EhBasicMonitor;
