import EventInterface from '../../../tools/event/EventInterface';
import CartridgeInfo from './CartridgeInfo';

interface CartridgeInterface {

    read(address: number): number;

    write(address: number, value: number): void;

    tiaWrite(address: number, value: number): void;

    getType(): CartridgeInfo.CartridgeType;

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
