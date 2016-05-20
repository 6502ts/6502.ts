import EventInterface from '../../tools/event/EventInterface';

interface CartridgeInterface {

    read(address: number): number;

    write(address: number, value: number): void;

    trap: EventInterface<CartridgeInterface.TrapPayload>;

}

module CartridgeInterface {

    export const enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public cartridge: CartridgeInterface,
            public message?: string
        ) {}
    }
}

export default CartridgeInterface;
