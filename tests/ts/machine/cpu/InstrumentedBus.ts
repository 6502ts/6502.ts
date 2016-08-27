import BusInterface from '../../../../src/machine/bus/BusInterface';
import AccessLog from './AccessLog';

class InstrumentedBus implements BusInterface {

    readWord(address: number): number {
        return this.read(address) | (this.read((address + 1) & 0xFFFF) << 8);
    }

    read(address: number): number {
        this._accessLog.read(address);

        return this._memory[address];
    }

    write(address: number, value: number): void {
        this._accessLog.write(address);

        this._memory[address] = value;
    }

    peek(address: number): number {
        return this.read(address);
    }

    poke(address: number, value: number): void {
        return this.write(address, value);
    }

    getLog(): AccessLog {
        return this._accessLog;
    }

    private _accessLog = new AccessLog();
    private _memory = new Uint8Array(0x10000);

}

export default InstrumentedBus;