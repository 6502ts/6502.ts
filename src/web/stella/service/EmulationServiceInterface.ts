import {EventInterface} from 'microevent.ts';

import StellaConfig from '../../../machine/stella/Config';
import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';
import EmulationContextInterface from './EmulationContextInterface';

interface EmulationServiceInterface {

    init(): Promise<void>;

    start(
        buffer: {[i: number]: number, length: number},
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<EmulationServiceInterface.State>;

    stop(): Promise<EmulationServiceInterface.State>;

    pause(): Promise<EmulationServiceInterface.State>;

    resume(): Promise<EmulationServiceInterface.State>;

    reset(): Promise<EmulationServiceInterface.State>;

    setRateLimit(enforce: boolean): Promise<void>;

    getRateLimit(): boolean;

    getState(): EmulationServiceInterface.State;

    getLastError(): Error;

    getEmulationContext(): EmulationContextInterface;

    getFrequency(): number;

    stateChanged: EventInterface<EmulationServiceInterface.State>;

    frequencyUpdate: EventInterface<number>;

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
