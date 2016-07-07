import Event from '../../../tools/event/Event';
import CartridgeInterface from './CartridgeInterface';
import CartridgeInfo from './CartridgeInfo';
import CpuInterface from '../../cpu/CpuInterface';
import BusInterface from '../../bus/BusInterface';


class AbstractCartridge implements CartridgeInterface {

    read(address: number): number {
        return 0;
    }

    write(address: number, value: number) {
    }

    tiaWrite(address: number, value: number) {
    }

    tiaRead(address: number) {
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.unknown;
    }

    setCpu(cpu: CpuInterface): this {
        return this;
    }

    setBus(bus: BusInterface): this {
        return this;
    }

    notifyCpuCycleComplete(): void {
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
