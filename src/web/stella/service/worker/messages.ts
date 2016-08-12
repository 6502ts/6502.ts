import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

export const RPC_TYPE = {
    emulationPause: 'emulation/pause',
    emulationReset: 'emulation/reset',
    emulationResume: 'emulationResume',
    emulationSetRateLimit: 'emulation/setRateLimit',
    emulationStart: 'emulation/start',
    emulationStop: 'emulation/stop',
    emulationGetParameters: 'emulation/getParameters',
    emulationFetchLastError: 'emulation/fetchLastError'
};
Object.freeze(RPC_TYPE);

export const SIGNAL_TYPE = {
    emulationError: 'emulation/error',
    emulationFrequencyUpdate: 'emulation/frequencyUpdate',
    videoNewFrame: 'video/newFrame',
    videoReturnSurface: 'video/returnSurface',
    controlStateUpdate: 'control/stateUpdate',
    audioVolumeChange: 'audio/volumeChange',
    audioBufferChange: 'audio/bufferChange',
    audioStop: 'audio/stop'
};
Object.freeze(SIGNAL_TYPE);

export interface EmulationStartMessage {
    buffer: {[i: number]: number, length: number};
    config: StellaConfig;
    cartridgeType?: CartridgeInfo.CartridgeType;
};

export interface EmulationParametersResponse {
    width: number;
    height: number;
    volume: Array<number>;
};

export interface VideoNewFrameMessage {
    id: number;
    width: number;
    height: number;
    buffer: ArrayBuffer;
}

export interface VideoReturnSurfaceMessage {
    id: number;
    buffer: ArrayBuffer;
}

export interface AudioVolumeChangeMessage {
    index: number;
    value: number;
}

export interface AudioBufferChangeMessage {
    index: number;
    key: number;
}