import VanillaMemory = require('../vanilla/Memory');
import SimpleSerialIOInterface = require('../io/SimpleSerialIOInterface');

class Memory extends VanillaMemory implements SimpleSerialIOInterface {
    read(address: number): number {
        if (address === 0xF004) {
            return this._inCallback(this);
        } else {
            return this._data[address];
        }
    }

    readWord(address: number): number {
        if ((address & 0xFFF0) === 0xF000) {
            return this.read(address) + this.read((address+1) & 0xFFFF) << 8;
        }

        return this._data[address] + (this._data[(address+1) & 0xFFFF] << 8);
    }

    write(address: number, value: number) {
        if (address === 0xF001) {
            this._outCallback(value, this);
        } else if (address < 0xC000) {
            this._data[address] = value;
        }
    }

    setInCallback(callback: SimpleSerialIOInterface.InCallbackInterface): Memory {
        this._inCallback = callback;
        return this;
    }

    getInCallback(): SimpleSerialIOInterface.InCallbackInterface {
        return this._inCallback;
    }

    setOutCallback(callback: SimpleSerialIOInterface.OutCallbackInterface): Memory {
        this._outCallback = callback;
        return this;
    }

    getOutCallback(): SimpleSerialIOInterface.OutCallbackInterface {
        return this._outCallback;
    }

    private _inCallback: SimpleSerialIOInterface.InCallbackInterface =
        (): number => 0x00;
    private _outCallback: SimpleSerialIOInterface.OutCallbackInterface =
        (): void => undefined;
}

export = Memory;
