'use strict';

import BusInterface = require('../bus/BusInterface');
import Event = require('../../tools/event/Event');
import Tia = require('./Tia');
import Pia = require('./Pia');
import Cartridge = require('./Cartridge');

class Bus implements BusInterface {

    constructor (
        private tia: Tia,
        private pia: Pia,
        private cartridge: Cartridge
    ) {
        tia.trap.addHandler((payload: Tia.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.tia, 'TIA: ' + (payload.message || '')));

        pia.trap.addHandler((payload: Pia.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.pia, 'PIA: ' + (payload.message || '')));

        cartridge.trap.addHandler((payload: Cartridge.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.cartridge, 'CARTRIDGE: ' + (payload.message || '')));
    }

    event = new Event<Bus.TrapPayload>();

    read(address: number): number {
        address &= 0x1FFF;

        if (address & 0x1000) {
            return this.cartridge.read(address);
        }

        if (address & 0x80) {
            return this.pia.read(address);
        }

        return this.tia.read(address);
    }

    readWord(address: number): number {
        return this.read(address) | ((this.read((address + 1) & 0xFFFF)) << 8);
    }

    write(address: number, value: number): void {
        address &= 0x1FFF;

        if (address & 0x1000) {
            this.cartridge.write(address, value);
        }

        if (address & 0x80) {
            return this.pia.write(address, value);
        }

        return this.tia.write(address, value);
    }

    // Stub
    peek(address: number): number {
        return 0;
    }

    // Stub
    poke(address: number, value: number) {}

    trap = new Event<Bus.TrapPayload>();

    private triggerTrap(reason: Bus.TrapReason, message?: string): void {
        if (this.trap.hasHandlers) {
            this.trap.dispatch(new Bus.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }
    }
}

module Bus {

    export enum TrapReason {tia, pia, cartridge}

    export class TrapPayload {

        constructor (
            public reason: TrapReason,
            public bus: Bus,
            public message?: string
        ) {}

    }

}

export = Bus;
