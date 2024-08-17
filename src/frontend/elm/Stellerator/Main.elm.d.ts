/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import { CartridgeType as CartridgeTypeEnum } from '../../../machine/stella/cartridge/CartridgeInfo';

export const enum TvMode {
    pal = 'pal',
    ntsc = 'ntsc',
    secam = 'secam',
}

export const enum CpuEmulation {
    cycle = 'cycle',
    instruction = 'instruction',
}

export const enum AudioEmulation {
    waveform = 'waveform',
    pcm = 'pcm',
}

export const enum Media {
    narrow = 'narrow',
    wide = 'wide',
}

export const enum EmulationStateKey {
    stopped = 'stopped',
    paused = 'paused',
    running = 'running',
    error = 'error',
}

export const enum InputDriverEvent {
    togglePause = 'pause',
    reset = 'reset',
    toggleFullscreen = 'fullscreen',
}

export const enum DifficultySwitch {
    pro = 'pro',
    amateur = 'amateur',
}

export const enum ColorSwitch {
    color = 'color',
    bw = 'bw',
}

export const enum TvEmulation {
    composite = 'composite',
    svideo = 'svideo',
    none = 'none',
}

export const enum Scaling {
    qis = 'qis',
    bilinear = 'bilinear',
    none = 'none',
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
    cartridgeType: CartridgeTypeEnum;
    tvMode: TvMode;
    emulatePaddles: boolean;
    volume: number;
    rngSeed?: number;
    firstVisibleLine?: number;
    cpuEmulation?: CpuEmulation;
    audioEmulation?: AudioEmulation;
    phosphorLevel?: number;
}

export interface Settings {
    cpuEmulation: CpuEmulation;
    volume: number;
    audioEmulation: AudioEmulation;
    gammaCorrection: number;
    tvEmulation: TvEmulation;
    scaling: Scaling;
    phosphorLevel: number;
    scanlineIntensity: number;
    leftHanded: boolean;
    virtualJoystickSensitivity: number;
    uiSize: number;
    touchControls?: boolean;
    uiMode?: Media;
}

export interface CartridgeType {
    key: CartridgeTypeEnum;
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
    gamepadCount: number;
    badGpu: boolean;
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
    saveCartridge_: CommandPort<string>;

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

    onUpdateGamepadCount_: SubscriptionPort<number>;
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

export declare namespace Elm {
    export namespace Stellerator {
        const Main: Main;
    }
}
