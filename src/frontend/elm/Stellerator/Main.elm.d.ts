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

export interface CartridgeType {
    key: CartridgeInfo.CartridgeType;
    description: string;
}

export interface Flags {
    cartridges: Array<Cartridge>;
    cartridgeTypes: Array<CartridgeType>;
}

export interface Options {
    flags?: Flags;
}

export interface Ports {
    watchMedia_: CommandPort<Array<string>>;
    onMediaUpdate_: SubscriptionPort<Array<boolean>>;

    scrollIntoView_: CommandPort<[ScrollLogicalPosition, string]>;

    addCartridge_: CommandPort<void>;
    onNewCartridges_: SubscriptionPort<Array<Cartridge>>;

    updateCartridge_: CommandPort<Cartridge>;
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

declare module Elm {
    export module Stellerator {
        const Main: Main;
    }
}

export default Elm;
