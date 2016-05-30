import Event from '../../tools/event/Event';

class Pia {

    reset(): void {
        for (let i = 0; i < 128; i++) this.ram[i] = 0;
    }

    read(address: number): number {
        // RAM select = A9 low?
        if (address & 0x0200) {
            if (address & 0x0004) {
                return this._readTimer(address);
            } else {
                return this._readIo(address);
            }
        } else {
            // Mask out A7 - A15
            return this.ram[address & 0x7F];
        }
    }

    write(address: number, value: number) {
        // RAM select = A9 low?
        if (address & 0x0200) {
            if (address & 0x0004) {
                return this._writeTimer(address, value);
            } else {
                return this._writeIo(address, value);
            }
        } else {
            // Mask out A7 - A15
            this.ram[address & 0x7F] = value;
        }
    }

    cycle(): void {
        this._cycleTimer();
    }

    getDebugState(): string {
        return `timer base: ${this._timerBase}   timer sub: ${this._timerSub}   timer value: ${this._timerValue}`;
    }

    trap = new Event<Pia.TrapPayload>();

    ram = new Uint8Array(128);

    private _writeIo(address: number, value: number): void {
    }

    private _writeTimer(address: number, value: number): void {
        switch (address & 0x029F) {
            case Pia.Registers.t1024t:
                return this._setTimer(1024, value);

            case Pia.Registers.tim64t:
                return this._setTimer(64, value);

            case Pia.Registers.tim8t:
                return this._setTimer(8, value);

            case Pia.Registers.tim1t:
                return this._setTimer(1, value);
        }
    }

    private _setTimer(base: number, value: number): void {
        this._timerBase = base;
        this._timerSub = 0;
        this._timerValue = value;
    }

    private _readIo(address: number): number {
        return 0;
    }

    private _readTimer(address: number): number {
        switch (address & 0x029F) {
            case Pia.Registers.intim:
                return this._timerValue;

        }

        return 0;
    }

    private _cycleTimer(): void {
        this._timerSub++;

        if (this._timerSub === this._timerBase) {
            if (this._timerValue === 0) {
                this._timerValue = 0xFF;
                this._timerBase = 1;
            } else {
                this._timerValue--;
            }

            this._timerSub = 0;
        }
    }

    private _timerValue = 0;
    private _timerSub = 0;
    private _timerBase = 1;
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

export default Pia;
