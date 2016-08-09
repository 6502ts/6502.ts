import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

export const RPC_TYPE = {
    emulationPause: 'emulation/pause',
    emulationReset: 'emulation/reset',
    emulationResume: 'emulationResume',
    emulationSetRateLimit: 'emulation/setRateLimit',
    emulationStart: 'emulation/start',
    emulationStop: 'emulation/stop',
    emulationFetchLastError: 'emulation/fetchLastError'
};
Object.freeze(RPC_TYPE);

export const SIGNAL_TYPE = {
    emulationError: 'emulation/error',
    emulationFrequencyUpdate: 'emulation/frequencyUpdate'
};
Object.freeze(SIGNAL_TYPE);

export interface EmulationStartMessage {
    buffer: {[i: number]: number, length: number};
    config: StellaConfig;
    cartridgeType?: CartridgeInfo.CartridgeType;
};
