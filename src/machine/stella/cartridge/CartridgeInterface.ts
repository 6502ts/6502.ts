import EventInterface from '../../../tools/event/EventInterface';
import CartridgeInfo from './CartridgeInfo';
import Cpuinterface from '../../cpu/CpuInterface';
import BusInterface from '../../bus/BusInterface';

interface CartridgeInterface {

    read(address: number): number;

    write(address: number, value: number): void;

    tiaWrite(address: number, value: number): void;

    tiaRead(address: number): void;

    getType(): CartridgeInfo.CartridgeType;

    setCpu(cpu: Cpuinterface): this;

    setBus(bus: BusInterface): this;

    notifyCpuCycleComplete(): void;

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
