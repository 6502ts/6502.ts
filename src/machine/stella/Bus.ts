import BusInterface = require('../bus/BusInterface');
import Event = require('../../tools/event/Event');
import Tia = require('./Tia');
import Pia = require('./Pia');
import CartridgeInterface = require('./CartridgeInterface');

class Bus implements BusInterface {

    setTia(tia: Tia): Bus {
        tia.trap.addHandler((payload: Tia.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.tia, 'TIA: ' + (payload.message || '')));

        this._tia = tia;

        return this;
    }

    setPia(pia: Pia): Bus {
        pia.trap.addHandler((payload: Pia.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.pia, 'PIA: ' + (payload.message || '')));

        this._pia = pia;

        return this;
    }

    setCartridge(cartridge: CartridgeInterface): Bus {
        cartridge.trap.addHandler((payload: CartridgeInterface.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.cartridge, 'CARTRIDGE: ' + (payload.message || '')));

        this._cartridge = cartridge;

        return this;
    }

    read(address: number): number {
        // Mask out bits 13-15
        address &= 0x1FFF;

        // Chip select A12 -> cartridge
        if (address & 0x1000) {
            return this._cartridge.read(address);
        }

        // Chip select A7 -> PIA
        if (address & 0x80) {
            return this._pia.read(address);
        }

        // All chip selects low -> TIA
        return this._tia.read(address);
    }

    readWord(address: number): number {
        return this.read(address) | ((this.read((address + 1) & 0xFFFF)) << 8);
    }

    write(address: number, value: number): void {
        // Mask out bits 12-15
        address &= 0x1FFF;

        // Chip select A12 -> cartridge
        if (address & 0x1000) {
            this._cartridge.write(address, value);
        }

        // Chip select A7 -> PIA
        if (address & 0x80) {
            return this._pia.write(address, value);
        }

        // All chip selects low -> TIA
        return this._tia.write(address, value);
    }

    peek(address: number): number {
        return this.read(address);
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

    private _tia: Tia;
    private _pia: Pia;
    private _cartridge: CartridgeInterface;
}

module Bus {

    export const enum TrapReason {tia, pia, cartridge}

    export class TrapPayload {

        constructor (
            public reason: TrapReason,
            public bus: Bus,
            public message?: string
        ) {}

    }

}

export = Bus;
