import EventInterface from '../../../tools/event/EventInterface';
import CartridgeInfo from './CartridgeInfo';
import Cpuinterface from '../../cpu/CpuInterface';
import BusInterface from '../../bus/BusInterface';

import RngInterface from '../../../tools/rng/GeneratorInterface';

interface CartridgeInterface {

    read(address: number): number;

    write(address: number, value: number): void;

    getType(): CartridgeInfo.CartridgeType;

    setCpu(cpu: Cpuinterface): this;

    setBus(bus: BusInterface): this;

    notifyCpuCycleComplete(): void;

    randomize(rng: RngInterface): void;

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
