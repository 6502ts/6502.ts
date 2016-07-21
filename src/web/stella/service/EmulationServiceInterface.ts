import EventInterface from '../../../tools/event/EventInterface';
import StellaConfig from '../../../machine/stella/Config';
import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';
import EmulationContextInterface from './EmulationContextInterface';

interface EmulationServiceInterface {

    start(
        buffer: {[i: number]: number, length: number},
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<EmulationServiceInterface.State>;

    stop(): Promise<EmulationServiceInterface.State>;

    pause(): Promise<EmulationServiceInterface.State>;

    resume(): Promise<EmulationServiceInterface.State>;

    reset(): Promise<EmulationServiceInterface.State>;

    getState(): EmulationServiceInterface.State;

    getLastError(): Error;

    getEmulationContext(): EmulationContextInterface;

    stateChanged: EventInterface<EmulationServiceInterface.State>;

}

module EmulationServiceInterface {

    export enum State {
        stopped,
        running,
        paused,
        error
    }

}

export default EmulationServiceInterface;
