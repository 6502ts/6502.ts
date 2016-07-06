import Event from '../../../tools/event/Event';
import CartridgeInterface from './CartridgeInterface';
import CartridgeInfo from './CartridgeInfo';


class AbstractCartridge implements CartridgeInterface {

    read(address: number): number {
        return 0;
    }

    write(address: number, value: number) {
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.unknown;
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
