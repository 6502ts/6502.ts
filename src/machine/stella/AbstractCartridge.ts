'use strict';

import Event = require('../../tools/event/Event');

class AbstractCartridge {

    read(address: number): number {
        return 0;
    }

    write(address: number, value: number) {
        this.triggerTrap(AbstractCartridge.TrapReason.invalidWrite, 'attempt to write to ROM');
    }

    trap = new Event<AbstractCartridge.TrapPayload>();

    protected triggerTrap(reason: AbstractCartridge.TrapReason, message: string) {
        if (this.trap.hasHandlers) {
            this.trap.dispatch(new AbstractCartridge.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }
    }
}

module AbstractCartridge {

    export enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public cartridge: AbstractCartridge,
            public message?: string
        ) {}
    }
}

export = AbstractCartridge;
