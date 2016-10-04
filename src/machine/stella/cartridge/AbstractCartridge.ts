import {Event} from 'microevent.ts';

import CartridgeInterface from './CartridgeInterface';
import CartridgeInfo from './CartridgeInfo';
import CpuInterface from '../../cpu/CpuInterface';
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class AbstractCartridge implements CartridgeInterface {

    reset(): void {}

    read(address: number): number {
        return 0;
    }

    peek(address: number): number {
        return this.read(address);
    }

    write(address: number, value: number) {
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.unknown;
    }

    setCpu(cpu: CpuInterface): this {
        return this;
    }

    setBus(bus: Bus): this {
        return this;
    }

    notifyCpuCycleComplete(): void {
    }

    randomize(rng: RngInterface): void {
    }

    trap = new Event<CartridgeInterface.TrapPayload>();

    protected triggerTrap(reason: CartridgeInterface.TrapReason, message: string) {
        if (this.trap.hasHandlers) {
            this.trap.dispatch(new CartridgeInterface.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }
    }
}

export default AbstractCartridge;
