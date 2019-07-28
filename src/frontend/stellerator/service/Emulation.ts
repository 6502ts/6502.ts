import { injectable, inject } from 'inversify';
import { Mutex } from 'async-mutex';

import EmulationServiceInterface from '../../../web/stella/service/EmulationServiceInterface';
import EmulationService from '../../../web/stella/service/worker/EmulationService';
import DriverManager from '../../../web/stella/service/DriverManager';
import Config from '../../../machine/stella/Config';
import CpuFactory from '../../../machine/cpu/Factory';
import VideoDriver from '../../../web/driver/webgl/WebglVideo';

import {
    Ports,
    Cartridge,
    Settings,
    EmulationState,
    EmulationStateKey,
    CpuEmulation,
    TvMode,
    AudioEmulation
} from '../../elm/Stellerator/Main.elm';
import Storage from './Storage';

const CANVAS_ID = 'stellerator-canvas';
const WORKER_URL = 'stellerator.min.js';

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
    }

    init(ports: Ports): void {
        this._ports = ports;

        ports.startEmulation_.subscribe(this._onEmulationStarted);
        ports.stopEmulation_.subscribe(this._onEmulationStopped);
        ports.pauseEmulation_.subscribe(this._onEmulationPaused);
        ports.resumeEmulation_.subscribe(this._onEmulationResumed);

        this._emulationService.stateChanged.addHandler(Emulation._onEmulationStateChange, this);
        this._emulationService.frequencyUpdate.addHandler(Emulation._onFrequencyChange, this);

        this._mutationObserver.observe(document.body, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true
        });
    }

    private async _startEmulation(hash: string): Promise<void> {
        const [cartidge, image, settings]: readonly [Cartridge, Uint8Array, Settings] = await Promise.all([
            this._storage.getCartridge(hash),
            this._storage.getCartridgeImage(hash),
            this._storage.getSettings()
        ]);

        if (!(cartidge && image)) {
            throw new Error(`invalid cartridge hash ${hash}`);
        }

        this._currentConfig = config(cartidge, settings);

        await this._emulationServiceReady;
        await this._emulationService.start(image, this._currentConfig, cartidge.cartridgeType);
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
            .enableInterpolation(settings.smoothScaling)
            .enableSyncRendering(settings.videoSync)
            .init();

        this._driverManager.addDriver(this._videoDriver, context => this._videoDriver.bind(context.getVideo()));
    }

    private async _bindCanvas(canvas: HTMLCanvasElement): Promise<void> {
        await this._createAndBindVideoDriver(canvas);
    }

    private async _rebindCanvas(canvas: HTMLCanvasElement): Promise<void> {
        await this._createAndBindVideoDriver(canvas);
    }

    private async _unbindCanvas(): Promise<void> {
        await this._removeVideoDriver();
        this._canvas = null;
    }

    private _removeVideoDriver(): void {
        if (!this._videoDriver) {
            return;
        }

        this._driverManager.removeDriver(this._videoDriver);

        this._videoDriver = null;
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

    private _onEmulationStarted = async (hash: string) => {
        try {
            await this._emulationMutex.runExclusive(() => this._startEmulation(hash));
        } catch (e) {
            this._ports.onEmulationStateChange_.send(error(e.message));
        }
    };

    private _onEmulationStopped = () => this._emulationMutex.runExclusive(() => this._stopEmulation());

    private _onEmulationPaused = () => this._emulationMutex.runExclusive(() => this._pauseEmulation());

    private _onEmulationResumed = () => this._emulationMutex.runExclusive(() => this._resumeEmulation());

    private _onMutation = (mutations: Array<MutationRecord>): void => {
        if (!mutations.some(m => m.addedNodes)) {
            return;
        }

        const canvas: HTMLCanvasElement = document.getElementById(CANVAS_ID) as any;

        if (canvas === this._canvas) {
            return;
        }

        if (canvas && this._canvas) {
            this._canvasMutex.runExclusive(() => this._rebindCanvas(canvas));
        } else if (canvas) {
            this._canvasMutex.runExclusive(() => this._bindCanvas(canvas));
        } else {
            this._canvasMutex.runExclusive(() => this._unbindCanvas());
        }
    };

    private static _onEmulationStateChange(state: EmulationServiceInterface.State, self: Emulation) {
        self._ports.onEmulationStateChange_.send(self._emulationState(state));
    }

    private static _onFrequencyChange(frequency: number, self: Emulation): void {
        if (self._emulationService.getState() === EmulationServiceInterface.State.running) {
            self._ports.onEmulationStateChange_.send({
                state: EmulationStateKey.running,
                frequency
            });
        }
    }

    private _ports: Ports;

    private _emulationMutex = new Mutex();
    private _canvasMutex = new Mutex();

    private _emulationService: EmulationServiceInterface;
    private _emulationServiceReady: Promise<void>;
    private _driverManager = new DriverManager();

    private _currentCartridgeHash: string = null;

    private _canvas: HTMLCanvasElement = null;
    private _videoDriver: VideoDriver = null;
    private _mutationObserver = new MutationObserver(this._onMutation);

    private _currentConfig: Config = null;
}

export default Emulation;
