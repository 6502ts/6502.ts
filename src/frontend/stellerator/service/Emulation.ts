import { injectable, inject } from 'inversify';
import { Mutex } from 'async-mutex';

import EmulationServiceInterface from '../../../web/stella/service/EmulationServiceInterface';
import EmulationService from '../../../web/stella/service/worker/EmulationService';
import DriverManager from '../../../web/stella/service/DriverManager';
import Config from '../../../machine/stella/Config';
import CpuFactory from '../../../machine/cpu/Factory';
import VideoDriver from '../../../web/driver/webgl/WebglVideo';
import KeyboardDriver from '../../../web/stella/driver/KeyboardIO';
import AudioDriver from '../../../web/stella/driver/WebAudio';

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
    StartEmulationPayload
} from '../../elm/Stellerator/Main.elm';
import Storage from './Storage';
import FullscreenVideoDriver from '../../../web/driver/FullscreenVideo';
import TouchIO from '../../../web/stella/driver/TouchIO';

const CANVAS_ID = 'stellerator-canvas';
const WORKER_URL = 'worker/stellerator.min.js';

function error(msg: string): EmulationState {
    return {
        state: EmulationStateKey.error,
        error: msg
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

function config(cartridge: Cartridge, settings: Settings): Config {
    return {
        tvMode: tvMode(cartridge),
        enableAudio: cartridge.volume * settings.volume > 0,
        randomSeed: typeof cartridge.rngSeed === 'undefined' ? -1 : cartridge.rngSeed,
        emulatePaddles: cartridge.emulatePaddles,
        frameStart: typeof cartridge.firstVisibleLine === 'undefined' ? -1 : cartridge.firstVisibleLine,
        pcmAudio: (cartridge.audioEmulation || settings.audioEmulation) === AudioEmulation.pcm,
        cpuType: cpuType(cartridge, settings)
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

        this._mutationObserver.observe(document.body, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true
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
            this._videoDriver.enablePovEmulation(
                typeof cartridge.phosphorEmulation === 'undefined'
                    ? settings.phosphorEmulation
                    : cartridge.phosphorEmulation
            );
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
            this._videoDriver
                .enablePovEmulation(
                    typeof cartridge.phosphorEmulation === 'undefined'
                        ? settings.phosphorEmulation
                        : cartridge.phosphorEmulation
                )
                .enableInterpolation(settings.smoothScaling)
                .enableSyncRendering(settings.videoSync)
                .setGamma(settings.gammaCorrection);
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
                frequency
            });
        }
    }

    private async _startEmulation(hash: string, switches: ConsoleSwitches): Promise<void> {
        await this._emulationServiceReady;
        await this._emulationService.stop();

        const [cartidge, image, settings]: readonly [Cartridge, Uint8Array, Settings] = await Promise.all([
            this._storage.getCartridge(hash),
            this._storage.getCartridgeImage(hash),
            this._storage.getSettings()
        ]);

        if (!(cartidge && image)) {
            throw new Error(`invalid cartridge hash ${hash}`);
        }

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

        this._currentConfig = config(cartidge, settings);

        await this._emulationService.start(image, this._currentConfig, cartidge.cartridgeType);

        this._updateConsoleSwitches(switches);

        await this._emulationService.resume();

        this._currentCartridgeHash = hash;
    }

    private async _stopEmulation(): Promise<void> {
        await this._emulationService.stop();

        this._currentCartridgeHash = null;
    }

    private async _pauseEmulation(): Promise<void> {
        await this._emulationService.pause();
    }

    private async _resumeEmulation(): Promise<void> {
        if (this._emulationService.getState() === EmulationServiceInterface.State.paused) {
            await this._emulationService.resume();
        }
    }

    private async _resetEmulation(): Promise<void> {
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
        this._removeVideoDriver();

        const [settings, cartridge]: [Settings, Cartridge | undefined] = await Promise.all([
            this._storage.getSettings(),
            this._currentCartridgeHash && this._storage.getCartridge(this._currentCartridgeHash)
        ]);

        this._canvas = canvas;
        this._videoDriver = new VideoDriver(this._canvas, {
            gamma: settings.gammaCorrection,
            povEmulation:
                cartridge && typeof cartridge.phosphorEmulation !== 'undefined'
                    ? cartridge.phosphorEmulation
                    : settings.phosphorEmulation
        });

        this._videoDriver
            .init()
            .enableInterpolation(settings.smoothScaling)
            .enableSyncRendering(settings.videoSync);

        this._driverManager.addDriver(this._videoDriver, (context, driver: VideoDriver) =>
            driver.bind(context.getVideo())
        );

        this._fullscreenDriver = new FullscreenVideoDriver(this._videoDriver);
    }

    private async _bindCanvas(canvas: HTMLCanvasElement): Promise<void> {
        const settings = await this._storage.getSettings();
        await this._createAndBindVideoDriver(canvas);

        this._driverManager.addDriver(this._keyboardDriver, (context, driver: KeyboardDriver) =>
            driver.bind(context.getJoystick(0), context.getJoystick(1), context.getControlPanel())
        );

        if (settings.touchControls ?? TouchIO.isSupported()) {
            this._touchDriver = new TouchIO(canvas, settings.virtualJoystickSensitivity, settings.leftHanded);

            this._touchDriver.toggleFullscreen.addHandler(this._onInputToggleFullscreen);
            this._touchDriver.togglePause.addHandler(this._onInputTogglePause);

            this._driverManager.addDriver(this._touchDriver, (context, driver: TouchIO) =>
                driver.bind(context.getJoystick(0), context.getControlPanel())
            );
        }
    }

    private async _rebindCanvas(canvas: HTMLCanvasElement): Promise<void> {
        await this._createAndBindVideoDriver(canvas);
    }

    private async _unbindCanvas(): Promise<void> {
        this._driverManager.removeDriver(this._keyboardDriver);

        if (this._touchDriver) {
            this._driverManager.removeDriver(this._touchDriver);
            this._touchDriver = null;
        }

        await this._removeVideoDriver();

        this._handledCanvasElements.delete(this._canvas);
        this._canvas = null;
    }

    private _removeVideoDriver(): void {
        if (!this._videoDriver) {
            return;
        }

        this._driverManager.removeDriver(this._videoDriver);

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
        if (!mutations.some(m => m.addedNodes)) {
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
    private _audioDriver = new AudioDriver();
    private _touchDriver: TouchIO = null;

    private _currentConfig: Config = null;

    private _handledCanvasElements = new WeakSet<HTMLCanvasElement>();
}

export default Emulation;
