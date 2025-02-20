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

import { injectable, inject } from 'inversify';
import { Mutex } from 'async-mutex';

import {
    Ports,
    Cartridge,
    Settings,
    EmulationState,
    EmulationStateKey,
    CpuEmulation,
    TvMode,
    AudioEmulation,
    InputDriverEvent,
    ConsoleSwitches,
    DifficultySwitch,
    ColorSwitch,
    StartEmulationPayload,
    TvEmulation,
    Scaling,
    ControllerType,
} from '../../elm/Stellerator/Main.elm';

import EmulationServiceInterface from '../../../web/stella/service/EmulationServiceInterface';
import EmulationService from '../../../web/stella/service/worker/EmulationService';
import DriverManager from '../../../web/stella/service/DriverManager';
import Config from '../../../machine/stella/Config';
import CpuFactory from '../../../machine/cpu/Factory';
import VideoDriver from '../../../web/driver/Video';
import KeyboardDriver from '../../../web/stella/driver/KeyboardIO';
import AudioDriver from '../../../web/stella/driver/WebAudio';
import Storage from './Storage';
import FullscreenVideoDriver from '../../../web/driver/FullscreenVideo';
import TouchIO from '../../../web/stella/driver/TouchIO';
import MouseAsPaddleDriver from '../../../web/driver/MouseAsPaddle';
import GamepadDriver from '../../../web/driver/Gamepad';
import { Target } from '../../../web/driver/gamepad/Mapping';

const CANVAS_ID = 'stellerator-canvas';
const WORKER_URL = 'worker/stellerator.js';

function error(msg: string): EmulationState {
    return {
        state: EmulationStateKey.error,
        error: msg,
    };
}

function cpuType(cartidge: Cartridge, settings: Settings): CpuFactory.Type {
    const cpuEmulation = cartidge.cpuEmulation || settings.cpuEmulation;

    switch (cpuEmulation) {
        case CpuEmulation.cycle:
            return CpuFactory.Type.stateMachine;

        case CpuEmulation.instruction:
            return CpuFactory.Type.batchedAccess;

        default:
            throw new Error(`cannot happen: invalid cpu emulation mod e${cpuEmulation}`);
    }
}

function tvMode(cartridge: Cartridge): Config.TvMode {
    switch (cartridge.tvMode) {
        case TvMode.ntsc:
            return Config.TvMode.ntsc;

        case TvMode.pal:
            return Config.TvMode.pal;

        case TvMode.secam:
            return Config.TvMode.secam;

        default:
            throw new Error(`cannot happen: invalid TV mode ${cartridge.tvMode}`);
    }
}

function controllerType(controllerType: ControllerType): Config.ControllerType {
    switch (controllerType) {
        case ControllerType.joystick:
            return Config.ControllerType.joystick;

        case ControllerType.paddles:
            return Config.ControllerType.paddles;

        case ControllerType.keypad:
            return Config.ControllerType.keypad;

        default:
            throw new Error(`cannot happen: invalid controller type ${controllerType}`);
    }
}

function config(cartridge: Cartridge, settings: Settings): Config {
    return {
        tvMode: tvMode(cartridge),
        enableAudio: cartridge.volume * settings.volume > 0,
        randomSeed: typeof cartridge.rngSeed === 'undefined' ? -1 : cartridge.rngSeed,
        frameStart: typeof cartridge.firstVisibleLine === 'undefined' ? -1 : cartridge.firstVisibleLine,
        pcmAudio: (cartridge.audioEmulation || settings.audioEmulation) === AudioEmulation.pcm,
        cpuType: cpuType(cartridge, settings),
        controllerPort0: controllerType(cartridge.controllerPort0),
        controllerPort1: controllerType(cartridge.controllerPort1),
    };
}

function mapTvEmulation(tvEmulation: TvEmulation): VideoDriver.TvEmulation {
    switch (tvEmulation) {
        case TvEmulation.composite:
            return VideoDriver.TvEmulation.composite;

        case TvEmulation.svideo:
            return VideoDriver.TvEmulation.svideo;

        case TvEmulation.none:
            return VideoDriver.TvEmulation.none;

        default:
            throw new Error(`invalid TV emulation setting: ${tvEmulation}`);
    }
}

function mapScaling(scaling: Scaling): VideoDriver.ScalingMode {
    switch (scaling) {
        case Scaling.qis:
            return VideoDriver.ScalingMode.qis;

        case Scaling.bilinear:
            return VideoDriver.ScalingMode.bilinear;

        case Scaling.none:
            return VideoDriver.ScalingMode.none;

        default:
            throw new Error(`invalid scaling setting`);
    }
}

function videoSettings(cartridge: Cartridge | null, settings: Settings): VideoDriver.Config {
    return {
        gamma: settings.gammaCorrection,
        tvEmulation: mapTvEmulation(settings.tvEmulation),
        scalingMode: mapScaling(settings.scaling),
        phosphorLevel: (cartridge?.phosphorLevel ?? settings.phosphorLevel) / 100,
        scanlineLevel: settings.scanlineIntensity / 100,
    };
}

@injectable()
class Emulation {
    constructor(@inject(Storage) private _storage: Storage) {
        this._emulationService = new EmulationService(WORKER_URL);
        this._emulationServiceReady = this._emulationService.init();

        this._driverManager.bind(this._emulationService);
        this._audioDriver.init();

        this._keyboardDriver.hardReset.addHandler(this._onInputReset);
        this._keyboardDriver.togglePause.addHandler(this._onInputTogglePause);
        this._keyboardDriver.toggleFullscreen.addHandler(this._onInputToggleFullscreen);

        this._driverManager.addDriver(this._gamepadDriver, (context, driver: GamepadDriver) =>
            driver.bind([context.getJoystick(0), context.getJoystick(1)], {
                [Target.start]: context.getControlPanel().getResetButton(),
                [Target.select]: context.getControlPanel().getSelectSwitch(),
            })
        );
        this._gamepadDriver.init();

        window.addEventListener('resize', this._onWindowResize);
    }

    init(ports: Ports): void {
        this._ports = ports;

        ports.startEmulation_.subscribe(this._onEmulationStarted);
        ports.stopEmulation_.subscribe(this._onEmulationStopped);
        ports.pauseEmulation_.subscribe(this._onEmulationPaused);
        ports.resumeEmulation_.subscribe(this._onEmulationResumed);
        ports.resetEmulation_.subscribe(this._onEmulationReset);
        ports.toggleFullscreen_.subscribe(this._onToggleFullscreen);
        ports.setLimitFramerate_.subscribe(this._onSetLimitFramerate);
        ports.updateConsoleSwitches_.subscribe(this._onUpdateConsoleSwitches);

        this._emulationService.stateChanged.addHandler(Emulation._onEmulationStateChange, this);
        this._emulationService.frequencyUpdate.addHandler(Emulation._onFrequencyChange, this);

        this._gamepadDriver.gamepadCountChanged.addHandler((n) => {
            console.log(n);
            this._ports.onUpdateGamepadCount_.send(n);
        });
        this._ports.onUpdateGamepadCount_.send(GamepadDriver.probeGamepadCount());

        this._mutationObserver.observe(document.body, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true,
        });
    }

    async updateCartridge(cartridge: Cartridge): Promise<void> {
        if (cartridge.hash !== this._currentCartridgeHash) {
            return;
        }

        switch (this._emulationService.getState()) {
            case EmulationServiceInterface.State.running:
            case EmulationServiceInterface.State.paused:
                break;

            default:
                return;
        }

        const settings = await this._storage.getSettings();

        this._audioDriver.setMasterVolume((cartridge.volume * settings.volume) / 10000);
        if (this._videoDriver) {
            this._videoDriver.updateConfig(videoSettings(cartridge, settings));
        }
    }

    async updateSettings(settings: Settings): Promise<void> {
        switch (this._emulationService.getState()) {
            case EmulationServiceInterface.State.running:
            case EmulationServiceInterface.State.paused:
                break;

            default:
                return;
        }

        const cartridge = await this._storage.getCartridge(this._currentCartridgeHash);

        this._audioDriver.setMasterVolume((cartridge.volume * settings.volume) / 10000);

        if (this._videoDriver) {
            this._videoDriver.updateConfig(videoSettings(cartridge, settings));
        }
    }

    private static _onEmulationStateChange(state: EmulationServiceInterface.State, self: Emulation) {
        self._ports.onEmulationStateChange_.send(self._emulationState(state));

        if (state === EmulationServiceInterface.State.running) {
            self._audioDriver.resume();
        } else {
            self._audioDriver.pause();
        }
    }

    private static _onFrequencyChange(frequency: number, self: Emulation): void {
        if (self._emulationService.getState() === EmulationServiceInterface.State.running) {
            self._ports.onEmulationStateChange_.send({
                state: EmulationStateKey.running,
                frequency,
            });
        }
    }

    private async _startEmulation(hash: string, switches: ConsoleSwitches): Promise<void> {
        await this._emulationServiceReady;
        await this._emulationService.stop();

        const [cartidge, image, settings]: readonly [Cartridge, Uint8Array, Settings] = await Promise.all([
            this._storage.getCartridge(hash),
            this._storage.getCartridgeImage(hash),
            this._storage.getSettings(),
        ]);

        if (!(cartidge && image)) {
            throw new Error(`invalid cartridge hash ${hash}`);
        }

        this._currentCartridgeHash = hash;

        const newConfig = config(cartidge, settings);

        if (!this._currentConfig || this._currentConfig.pcmAudio !== newConfig.pcmAudio) {
            this._driverManager.removeDriver(this._audioDriver);
            this._driverManager.addDriver(this._audioDriver, (context, driver: AudioDriver) =>
                driver.bind(
                    newConfig.pcmAudio,
                    newConfig.pcmAudio ? [context.getPCMChannel()] : context.getWaveformChannels()
                )
            );
        }

        this._audioDriver.setMasterVolume((cartidge.volume * settings.volume) / 10000);

        if (this._videoDriver) this._videoDriver.updateConfig(videoSettings(cartidge, settings));

        this._currentConfig = config(cartidge, settings);

        this._keyboardDriver.remap(KeyboardDriver.defaultMappings);
        if (this._currentConfig.controllerPort0 === Config.ControllerType.keypad) {
            this._keyboardDriver.overlay(KeyboardDriver.keypad0Mappings);
        }
        if (this._currentConfig.controllerPort1 === Config.ControllerType.keypad) {
            this._keyboardDriver.overlay(KeyboardDriver.keypad1Mappings);
        }

        await this._emulationService.start(image, this._currentConfig, cartidge.cartridgeType);

        this._updateConsoleSwitches(switches);

        await this._emulationService.resume();
    }

    private async _stopEmulation(): Promise<void> {
        await this._emulationServiceReady;
        await this._emulationService.stop();

        this._currentCartridgeHash = null;
    }

    private async _pauseEmulation(): Promise<void> {
        await this._emulationServiceReady;
        await this._emulationService.pause();
    }

    private async _resumeEmulation(): Promise<void> {
        await this._emulationServiceReady;

        if (this._emulationService.getState() === EmulationServiceInterface.State.paused) {
            await this._emulationService.resume();
        }
    }

    private async _resetEmulation(): Promise<void> {
        await this._emulationServiceReady;
        await this._emulationService.reset();
    }

    private _updateConsoleSwitches(consoleSwitches: ConsoleSwitches): void {
        const context = this._emulationService.getEmulationContext();

        if (!context) {
            return;
        }

        const controlPanel = context.getControlPanel();

        controlPanel.getDifficultySwitchP0().toggle(consoleSwitches.difficultyP0 === DifficultySwitch.pro);
        controlPanel.getDifficultySwitchP1().toggle(consoleSwitches.difficultyP1 === DifficultySwitch.pro);
        controlPanel.getColorSwitch().toggle(consoleSwitches.color === ColorSwitch.bw);
    }

    private async _createAndBindVideoDriver(canvas: HTMLCanvasElement): Promise<void> {
        await this._emulationServiceReady;

        this._removeVideoDriver();

        // We need to synchronize this with the mutex in order to avoid a data race ---
        // _startEmulation can change the hash while dexie is busy.
        const [settings, cartridge]: [Settings, Cartridge | undefined] = await this._emulationMutex.runExclusive(() =>
            Promise.all([
                this._storage.getSettings(),
                this._currentCartridgeHash && this._storage.getCartridge(this._currentCartridgeHash),
            ])
        );

        this._canvas = canvas;
        this._videoDriver = new VideoDriver(this._canvas, videoSettings(cartridge, settings));

        this._videoDriver.init();

        this._driverManager.addDriver(this._videoDriver, (context, driver: VideoDriver) =>
            driver.bind(context.getVideo())
        );

        this._fullscreenDriver = new FullscreenVideoDriver(this._videoDriver);
    }

    private async _bindCanvas(canvas: HTMLCanvasElement): Promise<void> {
        const settings = await this._storage.getSettings();
        await this._createAndBindVideoDriver(canvas);

        if (settings.touchControls ?? TouchIO.isSupported()) {
            this._touchDriver = new TouchIO(canvas, settings.virtualJoystickSensitivity, settings.leftHanded);

            this._touchDriver.toggleFullscreen.addHandler(this._onInputToggleFullscreen);
            this._touchDriver.togglePause.addHandler(this._onInputTogglePause);

            this._driverManager.addDriver(this._touchDriver, (context, driver: TouchIO) =>
                driver.bind(context.getJoystick(0), context.getControlPanel())
            );
        }

        this._driverManager
            .addDriver(this._keyboardDriver, (context, driver: KeyboardDriver) =>
                driver.bind(
                    context.getJoystick(0),
                    context.getJoystick(1),
                    context.getKeypad(0),
                    context.getKeypad(1),
                    context.getControlPanel())
            )
            .addDriver(this._paddleDriver, (context, driver: MouseAsPaddleDriver) => driver.bind(context.getPaddle(0)));
    }

    private async _rebindCanvas(canvas: HTMLCanvasElement): Promise<void> {
        await this._createAndBindVideoDriver(canvas);
    }

    private async _unbindCanvas(): Promise<void> {
        if (this._touchDriver) {
            this._driverManager.removeDriver(this._touchDriver);
            this._touchDriver = null;
        }

        this._driverManager.removeDriver(this._keyboardDriver).removeDriver(this._paddleDriver);

        await this._removeVideoDriver();

        this._handledCanvasElements.delete(this._canvas);
        this._canvas = null;
    }

    private _removeVideoDriver(): void {
        if (!this._videoDriver) {
            return;
        }

        this._driverManager.removeDriver(this._videoDriver);
        this._videoDriver.close();

        this._videoDriver = null;

        this._fullscreenDriver.disengage();
        this._fullscreenDriver = null;
    }

    private _emulationState(stateIncoming: EmulationServiceInterface.State): EmulationState {
        switch (stateIncoming) {
            case EmulationServiceInterface.State.error:
                return error(this._emulationService.getLastError().message);

            case EmulationServiceInterface.State.running:
                return { state: EmulationStateKey.running };

            case EmulationServiceInterface.State.paused:
                return { state: EmulationStateKey.paused };

            case EmulationServiceInterface.State.stopped:
                return { state: EmulationStateKey.stopped };

            default:
                throw new Error(`cannot happen: invalid emulation state ${stateIncoming}`);
        }
    }

    private _onEmulationStarted = async ({ hash, switches }: StartEmulationPayload) => {
        try {
            await this._emulationMutex.runExclusive(() => this._startEmulation(hash, switches));
        } catch (e) {
            this._ports.onEmulationStateChange_.send(error(e.message));
        }
    };

    private _onEmulationStopped = () => this._emulationMutex.runExclusive(() => this._stopEmulation());

    private _onEmulationPaused = () => this._emulationMutex.runExclusive(() => this._pauseEmulation());

    private _onEmulationResumed = () => this._emulationMutex.runExclusive(() => this._resumeEmulation());

    private _onEmulationReset = () => this._emulationMutex.runExclusive(() => this._resetEmulation());

    private _onToggleFullscreen = () => this._fullscreenDriver && this._fullscreenDriver.toggle();

    private _onSetLimitFramerate = (limitFramerate: boolean) => this._emulationService.setRateLimit(limitFramerate);

    private _onInputTogglePause = () => this._ports.onInputDriverEvent_.send(InputDriverEvent.togglePause);

    private _onInputReset = () => this._ports.onInputDriverEvent_.send(InputDriverEvent.reset);

    private _onInputToggleFullscreen = () => this._ports.onInputDriverEvent_.send(InputDriverEvent.toggleFullscreen);

    private _onWindowResize = () => this._videoDriver && this._videoDriver.resize();

    private _onUpdateConsoleSwitches = (switches: ConsoleSwitches) =>
        this._emulationMutex.runExclusive(() => this._updateConsoleSwitches(switches));

    private _onMutation = (mutations: Array<MutationRecord>): void => {
        if (!mutations.some((m) => m.addedNodes)) {
            return;
        }

        const canvas: HTMLCanvasElement = document.getElementById(CANVAS_ID) as any;

        if (canvas === this._canvas || this._handledCanvasElements.has(canvas)) {
            return;
        }

        if (canvas) {
            this._handledCanvasElements.add(canvas);
        }

        if (canvas && this._canvas) {
            this._canvasMutex.runExclusive(() => this._rebindCanvas(canvas));
        } else if (canvas) {
            this._canvasMutex.runExclusive(() => this._bindCanvas(canvas));
        } else {
            this._canvasMutex.runExclusive(() => this._unbindCanvas());
        }
    };

    private _ports: Ports;

    private _emulationMutex = new Mutex();
    private _canvasMutex = new Mutex();

    private _emulationService: EmulationServiceInterface;
    private _emulationServiceReady: Promise<void>;
    private _driverManager = new DriverManager();

    private _currentCartridgeHash: string = null;

    private _canvas: HTMLCanvasElement = null;
    private _videoDriver: VideoDriver = null;
    private _fullscreenDriver: FullscreenVideoDriver = null;
    private _mutationObserver = new MutationObserver(this._onMutation);

    private _keyboardDriver = new KeyboardDriver(document);
    private _paddleDriver = new MouseAsPaddleDriver();
    private _audioDriver = new AudioDriver();
    private _gamepadDriver = new GamepadDriver();
    private _touchDriver: TouchIO = null;

    private _currentConfig: Config = null;

    private _handledCanvasElements = new WeakSet<HTMLCanvasElement>();
}

export default Emulation;
