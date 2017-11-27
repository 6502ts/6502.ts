/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import EmulationServiceInterface from '../../stella/service/EmulationServiceInterface';
import EmulationService from '../../stella/service/worker/EmulationService';
import DriverManager from '../../stella/service/DriverManager';

import VideoDriverInterface from '../../driver/VideoDriverInterface';
import CanvasVideo from '../../driver/SimpleCanvasVideo';
import WebglVideo from '../../driver/webgl/WebglVideo';

import AudioDriver from '../../stella/driver/WebAudio';
import KeyboardIO from '../../stella/driver/KeyboardIO';
import Paddle from '../../driver/MouseAsPaddle';
import FullscreenDriver from '../../driver/FullscreenVideo';

import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';
import StellaConfig from '../../../machine/stella/Config';

import { decode as decodeBase64 } from '../../../tools/base64';

class Stellerator {
    constructor(private _canvasElt: HTMLCanvasElement, workerUrl: string, config: Partial<Stellerator.Config> = {}) {
        this._config = {
            smoothScaling: true,
            simulatePov: true,
            gamma: 1,
            audio: true,
            volume: 1,
            enableKeyboard: true,
            keyboardTarget: document,
            fullscreenViaKeyboard: true,
            paddleViaMouse: true,

            ...config
        };

        this._emulationService = new EmulationService(workerUrl);
        this._createDrivers();
    }

    setGamma(gamma: number): this {
        if (this._webglVideo) {
            this._webglVideo.setGamma(gamma);
        }

        return this;
    }

    getGamma(): number {
        return this._webglVideo ? this._webglVideo.getGamma() : 1;
    }

    enablePovSimulation(povEnabled: boolean): this {
        if (this._webglVideo) {
            this._webglVideo.enablePovEmulation(povEnabled);
        }

        return this;
    }

    povSimulationEnabled(): boolean {
        return this._webglVideo ? this._webglVideo.povEmulationEnabled() : false;
    }

    enableSmoothScaling(smoothScalingEnabled: boolean): this {
        this._videoDriver.enableInterpolation(smoothScalingEnabled);

        return this;
    }

    smoothScalingEnabled(): boolean {
        return this._videoDriver.interpolationEnabled();
    }

    toggleFullscreen(fullscreen?: boolean): this {
        if (typeof fullscreen === 'undefined') {
            this._fullscreenVideo.toggle();
        } else {
            fullscreen ? this._fullscreenVideo.engage() : this._fullscreenVideo.disengage();
        }

        return this;
    }

    isFullscreen(): boolean {
        return this._fullscreenVideo.isEngaged();
    }

    setVolume(volume: number): this {
        if (this._audioDriver) {
            this._audioDriver.setMasterVolume(Math.max(Math.min(volume, 1), 0));
        }

        return this;
    }

    audioEnabled(): boolean {
        return !!this._audioDriver;
    }

    getVolume(): number {
        return this._audioDriver ? this._audioDriver.getMasterVolume() : 0;
    }

    async start(
        cartridge: ArrayLike<number> | string,
        cartidgeType: CartridgeInfo.CartridgeType,
        config: Stellerator.CartridgeConfig
    ): Promise<Stellerator.State> {
        if (typeof cartridge === 'string') {
            cartridge = decodeBase64(cartridge);
        }

        const stellaConfig = StellaConfig.create();

        if (typeof config.randomSeed !== 'undefined' && config.randomSeed > 0) {
            stellaConfig.randomSeed = config.randomSeed;
        }

        if (typeof config.emulatePaddles !== 'undefined') {
            stellaConfig.emulatePaddles = config.emulatePaddles;
        }

        if (typeof config.frameStart !== 'undefined') {
            stellaConfig.frameStart = config.frameStart;
        }

        return this._mapState(await this._emulationService.start(cartridge, stellaConfig, config.cartridgeType));
    }

    async pause(): Promise<Stellerator.State> {
        return this._mapState(await this._emulationService.pause());
    }

    async resume(): Promise<Stellerator.State> {
        return this._mapState(await this._emulationService.resume());
    }

    async stop(): Promise<Stellerator.State> {
        return this._mapState(await this._emulationService.stop());
    }

    lastError(): Error {
        return this._emulationService.getLastError();
    }

    private _createDrivers(): void {
        try {
            this._webglVideo = this._videoDriver = new WebglVideo(this._canvasElt, {
                povEmulation: this._config.simulatePov,
                gamma: this._config.gamma
            }).init();
        } catch (e) {
            this._webglVideo = null;
            this._videoDriver = new CanvasVideo(this._canvasElt).init();
        }

        this._videoDriver.enableInterpolation(this._config.smoothScaling);

        this._driverManager.addDriver(this._videoDriver, context => this._videoDriver.bind(context.getVideo()));

        this._fullscreenVideo = new FullscreenDriver(this._videoDriver);

        if (this._config.audio) {
            try {
                this._audioDriver = new AudioDriver();
                this._audioDriver.setMasterVolume(this._config.volume);

                this._driverManager.addDriver(this._audioDriver, context =>
                    this._audioDriver.bind(true, [context.getPCMChannel()])
                );
            } catch (e) {
                console.error(`failed to initialize audio: ${e && e.message}`);
            }
        }

        if (this._config.enableKeyboard) {
            this._keyboardIO = new KeyboardIO(this._config.keyboardTarget);

            this._driverManager.addDriver(this._keyboardIO, context =>
                this._keyboardIO.bind(context.getJoystick(0), context.getJoystick(1), context.getControlPanel())
            );

            if (this._config.fullscreenViaKeyboard) {
                this._keyboardIO.toggleFullscreen.addHandler(() => this._fullscreenVideo.toggle());
            }
        }

        if (this._config.paddleViaMouse) {
            this._paddle = new Paddle();

            this._driverManager.addDriver(this._paddle, context => this._paddle.bind(context.getPaddle(0)));
        }
    }

    private _mapState(state: EmulationServiceInterface.State): Stellerator.State {
        switch (state) {
            case EmulationServiceInterface.State.stopped:
                return Stellerator.State.stopped;

            case EmulationServiceInterface.State.running:
                return Stellerator.State.running;

            case EmulationServiceInterface.State.paused:
                return Stellerator.State.paused;

            case EmulationServiceInterface.State.error:
                return Stellerator.State.error;

            default:
                throw new Error('cannot happen');
        }
    }

    private _config: Stellerator.Config = null;
    private _emulationService: EmulationServiceInterface = null;

    private _videoDriver: VideoDriverInterface = null;
    private _webglVideo: WebglVideo = null;
    private _fullscreenVideo: FullscreenDriver = null;
    private _audioDriver: AudioDriver = null;
    private _keyboardIO: KeyboardIO = null;
    private _paddle: Paddle = null;

    private _driverManager = new DriverManager();
}

namespace Stellerator {
    export interface Config {
        smoothScaling: boolean;
        simulatePov: boolean;
        gamma: number;

        audio: boolean;
        volume: number;

        enableKeyboard: boolean;
        keyboardTarget: HTMLElement | HTMLDocument;
        fullscreenViaKeyboard: boolean;
        paddleViaMouse: boolean;
    }

    export enum TvMode {
        ntsc = 'ntsc',
        pal = 'pal',
        secam = 'secam'
    }

    export interface CartridgeConfig {
        cartridgeType?: CartridgeInfo.CartridgeType;
        randomSeed?: number;
        emulatePaddles?: boolean;
        frameStart?: number;
    }

    export const CartridgeType = CartridgeInfo.CartridgeType;

    export const describeCartridgeType = CartridgeInfo.CartridgeType;

    export const allCartridgeTypes = CartridgeInfo.getAllTypes;

    export enum State {
        running = 'running',
        paused = 'paused',
        stopped = 'stopped',
        error = 'error'
    }
}

export default Stellerator;
