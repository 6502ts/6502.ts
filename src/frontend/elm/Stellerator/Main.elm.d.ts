import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';

export const enum TvMode {
    pal = 'pal',
    ntsc = 'ntsc',
    secam = 'secam'
}

export const enum CpuEmulation {
    cycle = 'cycle',
    instruction = 'instruction'
}

export const enum AudioEmulation {
    waveform = 'waveform',
    pcm = 'pcm'
}

export const enum Media {
    narrow = 'narrow',
    wide = 'wide'
}

export const enum EmulationStateKey {
    stopped = 'stopped',
    paused = 'paused',
    running = 'running',
    error = 'error'
}

export const enum InputDriverEvent {
    togglePause = 'pause',
    reset = 'reset',
    toggleFullscreen = 'fullscreen'
}

export const enum DifficultySwitch {
    pro = 'pro',
    amateur = 'amateur'
}

export const enum ColorSwitch {
    color = 'color',
    bw = 'bw'
}

export interface EmulationStateStopped {
    state: EmulationStateKey.stopped;
}

export interface EmulationStatePaused {
    state: EmulationStateKey.paused;
}

export interface EmulationStateRunning {
    state: EmulationStateKey.running;
    frequency?: number;
}

export interface EmulationStateError {
    state: EmulationStateKey.error;
    error: string;
}

export type EmulationState = EmulationStateStopped | EmulationStatePaused | EmulationStateRunning | EmulationStateError;

export interface Cartridge {
    hash: string;
    name: string;
    cartridgeType: CartridgeInfo.CartridgeType;
    tvMode: TvMode;
    emulatePaddles: boolean;
    volume: number;
    rngSeed?: number;
    firstVisibleLine?: number;
    cpuEmulation?: CpuEmulation;
    audioEmulation?: AudioEmulation;
    phosphorEmulation?: boolean;
}

export interface Settings {
    cpuEmulation: CpuEmulation;
    volume: number;
    audioEmulation: AudioEmulation;
    smoothScaling: boolean;
    phosphorEmulation: boolean;
    gammaCorrection: number;
    videoSync: boolean;
    leftHanded: boolean;
    virtualJoystickSensitivity: number;
    uiSize: number;
    touchControls?: boolean;
    uiMode?: Media;
}

export interface CartridgeType {
    key: CartridgeInfo.CartridgeType;
    description: string;
}

export interface ConsoleSwitches {
    difficultyP0: DifficultySwitch;
    difficultyP1: DifficultySwitch;
    color: ColorSwitch;
}

export interface Flags {
    cartridges: Array<Cartridge>;
    cartridgeTypes: Array<CartridgeType>;
    settings: Settings;
    defaultSettings: Settings;
    touchSupport: boolean;
    version: string;
    wasUpdated: boolean;
}

export interface Options {
    flags?: Flags;
}

export interface StartEmulationPayload {
    hash: string;
    switches: ConsoleSwitches;
}

export interface Ports {
    watchMedia_: CommandPort<Array<string>>;
    onMediaUpdate_: SubscriptionPort<Array<boolean>>;

    scrollIntoView_: CommandPort<[ScrollLogicalPosition, string]>;
    scrollToTop_: CommandPort<void>;
    blurCurrentElement_: CommandPort<void>;

    addCartridge_: CommandPort<void>;
    onNewCartridges_: SubscriptionPort<Array<Cartridge>>;
    updateCartridge_: CommandPort<Cartridge>;
    deleteCartridge_: CommandPort<string>;
    deleteAllCartridges_: CommandPort<void>;

    updateSettings_: CommandPort<Settings>;

    startEmulation_: CommandPort<StartEmulationPayload>;
    stopEmulation_: CommandPort<void>;
    pauseEmulation_: CommandPort<void>;
    resumeEmulation_: CommandPort<void>;
    resetEmulation_: CommandPort<void>;
    toggleFullscreen_: CommandPort<void>;
    setLimitFramerate_: CommandPort<boolean>;
    updateConsoleSwitches_: CommandPort<ConsoleSwitches>;

    onEmulationStateChange_: SubscriptionPort<EmulationState>;
    onInputDriverEvent_: SubscriptionPort<InputDriverEvent>;
}

interface CommandPort<T> {
    subscribe(handler: (payload: T) => void): void;
}

interface SubscriptionPort<T> {
    send(payload: T): void;
}

export interface Main {
    init(options?: Options): { ports: Ports };
}

declare namespace Elm {
    export namespace Stellerator {
        const Main: Main;
    }
}

export default Elm;
