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

import { Mutex } from 'async-mutex';
import { EventInterface as Event, Event as EventImplementation } from 'microevent.ts';

import EmulationServiceInterface from '../../stella/service/EmulationServiceInterface';
import EmulationService from '../../stella/service/worker/EmulationService';
import DriverManager from '../../stella/service/DriverManager';

import WebglVideo from '../../driver/webgl/WebglVideo';

import AudioDriver from '../../stella/driver/WebAudio';
import KeyboardIO from '../../stella/driver/KeyboardIO';
import TouchIO from '../../stella/driver/TouchIO';
import Paddle from '../../driver/MouseAsPaddle';
import Gamepad from '../../driver/Gamepad';
import FullscreenDriver from '../../driver/FullscreenVideo';

import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';
import StellaConfig from '../../../machine/stella/Config';

import { decode as decodeBase64 } from '../../../tools/base64';

import ControlPanel from './ControlPanel';
import ControlPanelProxy from './ControlPanelProxy';
import { Target } from '../../driver/gamepad/Mapping';
import CpuFactory from '../../../machine/cpu/Factory';
import AsyncIO from '../../driver/AsyncIO';

function cpuType(config = Stellerator.CpuAccuracy.cycle): CpuFactory.Type {
    switch (config) {
        case Stellerator.CpuAccuracy.cycle:
            return CpuFactory.Type.stateMachine;

        case Stellerator.CpuAccuracy.instruction:
            return CpuFactory.Type.batchedAccess;

        default:
            throw new Error(`invalid CPU Accuracy: ${config}`);
    }
}

/**
 * The stellerator class and namespace. In a typical application, a single instance is
 * created and bound to a canvas element. This instance can than be used to run many
 * different ROMs during its lifetime.
 *
 * Notes on reading this documentation:
 * * All code examples are ES6
 * * The actual emulation runs on a web worker, and all methods that control emulation
 *   are asynchronous and return [ES6 Promises](http://exploringjs.com/es6/ch_promises.html)
 * * Check out the [microevent.ts](https://github.com/DirtyHairy/microevent) documentation
 *   for the event API
 *
 * Basic example:
 * ```typescript
 *     const stellerator = new Stellerator(
 *         document.getElementById('stellerator-canvas'),
 *         'js/stellerator_worker.js'
 *     );
 *
 *     stellerator.run(rom, Stellerator.TvMode.ntsc);
 * ```
 */
class Stellerator {
    /**
     * Creates an instance of Stellerator.
     * @param canvasElt The canvas element that is used to display the TIA image.
     * The `height` and `width` attributes of the canvas will be automatically
     * maintained by Stellerator, so there is not requirement to set those to
     * specific values.
     *
     * @param workerUrl The URL from which the web worker will be loaded.
     * In order to avoid cross domain issues, the worker should be hosted on the same
     * domain as the stellerator build, and this parameter should read e.g.
     * `js/stellerator_worker.js`
     *
     * @param config Optional configuration to
     * customize emulator behavior. See [[Config]] for a full explanation of the values
     * and their default.
     */
    constructor(
        canvasElt: HTMLCanvasElement | null = null,
        workerUrl: string,
        config: Partial<Stellerator.Config> = {}
    ) {
        this._canvasElt = canvasElt;

        this._config = {
            smoothScaling: true,
            simulatePov: true,
            gamma: 1,
            audio: true,
            volume: 0.5,
            enableKeyboard: true,
            enableTouch: true,
            touchLeftHanded: false,
            touchJoystickSensitivity: 15,
            keyboardTarget: document,
            fullscreenViaKeyboard: true,
            paddleViaMouse: true,
            pauseViaKeyboard: true,
            pauseViaTouch: true,
            fullscreenViaTouch: true,
            enableGamepad: true,
            resetViaKeyboard: true,

            ...config
        };

        this._emulationService = new EmulationService(workerUrl);

        this.frequencyUpdate = this._emulationService.frequencyUpdate;

        const stateChange = new EventImplementation<Stellerator.State>();
        this._emulationService.stateChanged.addHandler(newState => stateChange.dispatch(this._mapState(newState)));
        this.stateChange = stateChange;

        this._createDrivers();

        this._driverManager.addDriver(this._controlPanel, context =>
            this._controlPanel.bind(context.getControlPanel())
        );
        this._driverManager.bind(this._emulationService);

        this._serviceInitialized = this._emulationService.init().then(undefined, e => {
            console.log(e);
            throw e;
        });
    }

    /**
     * Set the gamma correction factor. Will take effect **only** if WebGL is available.
     *
     * @param gamma
     */
    setGamma(gamma: number): this {
        if (this._videoDriver) {
            // FIXME
        }

        this._config.gamma = gamma;

        return this;
    }

    /**
     * Query the current gamme correction factor.
     *
     * @returns {number}
     */
    getGamma(): number {
        // return this._videoDriver ? this._videoDriver.getGamma() : this._config.gamma;
        // FIXME
        return 1;
    }

    /**
     * Enable / disable persistence of vision / phosphor simulation. POV is simulated
     * by blending several frames and will work **only** if WebGL is available.
     *
     * @param povEnabled
     * @returns {this}
     */
    enablePovSimulation(povEnabled: boolean): this {
        if (this._videoDriver) {
            // this._videoDriver.enablePovEmulation(povEnabled);
            // FIXME
        }

        this._config.simulatePov = povEnabled;

        return this;
    }

    /**
     * Query the state of persistence of vision / phosphor emulation.
     *
     * @returns {boolean}
     */
    isPovSimulationEnabled(): boolean {
        // return this._videoDriver ? this._videoDriver.povEmulationEnabled() : this._config.simulatePov;
        // FIXME
        return false;
    }

    /**
     * Enable / disable smooth scaling of the TIA image.
     *
     * @param smoothScalingEnabled
     * @returns {this}
     */
    enableSmoothScaling(smoothScalingEnabled: boolean): this {
        if (this._videoDriver) {
            // this._videoDriver.enableInterpolation(smoothScalingEnabled);
            // FIXME
        }

        return this;
    }

    /**
     * Query whether smooth scaling of the TIA image is enabled.
     *
     * @returns {boolean}
     */
    smoothScalingEnabled(): boolean {
        // return this._videoDriver ? this._videoDriver.interpolationEnabled() : this._config.smoothScaling;
        // FIXME
        return false;
    }

    /**
     * Enable / disable fullscreen mode.
     *
     * @param fullscreen
     * @returns {this}
     */
    toggleFullscreen(fullscreen?: boolean): this {
        if (!this._fullscreenVideo) {
            return this;
        }

        if (typeof fullscreen === 'undefined') {
            this._fullscreenVideo.toggle();
        } else {
            fullscreen ? this._fullscreenVideo.engage() : this._fullscreenVideo.disengage();
        }

        return this;
    }

    /**
     * Query if emulator is running fullscreen.
     *
     * @returns {boolean}
     */
    isFullscreen(): boolean {
        return this._fullscreenVideo ? this._fullscreenVideo.isEngaged() : false;
    }

    /**
     * Change the master volume.
     *
     * @param volume Will be clipped to the range 0 .. 1
     * @returns {this}
     */
    setVolume(volume: number): this {
        if (this._audioDriver) {
            this._audioDriver.setMasterVolume(Math.max(Math.min(volume, 1), 0));
        }

        return this;
    }

    /**
     * Query whether audio has been enabled on this instance.
     *
     * @returns {boolean}
     */
    audioEnabled(): boolean {
        return !!this._audioDriver;
    }

    /**
     * Query the master volume.
     *
     * @returns {number}
     */
    getVolume(): number {
        return this._audioDriver ? this._audioDriver.getMasterVolume() : 0;
    }

    /**
     * Notify the video driver of a change of the visible dimensions (client size) of
     * the canvas element. This will cause the driver to adjust the resolution to match.
     */
    resize(): this {
        if (this._videoDriver) {
            this._videoDriver.resize();
        }

        return this;
    }

    /**
     * Query the current state of the emulation.
     *
     * @returns {Stellerator.State}
     */
    getState(): Stellerator.State {
        return this._state;
    }

    /**
     * Get the console control panel. This allows you to monitor and control
     * the console switches (select, reset, difficulty P1 / P2, color / BW).
     */
    getControlPanel(): ControlPanel {
        return this._controlPanel;
    }

    setCanvas(canvas: HTMLCanvasElement): this {
        this._canvasElt = canvas;

        this._createVideoDriver();
        this._createTouchDriver();

        return this;
    }

    releaseCanvas(): this {
        this._removeVideoDriver();
        this._removeTouchDriver();

        this._canvasElt = null;

        return this;
    }

    /**
     * Start emulation of a cartridge image. This method is **async** and returns
     * a promise for the resulting emulation state.
     *
     * **IMPORTANT:** The emulator will start up in [[State.paused]] mode. Use the `run` method
     * below in order to start and run the emulation immediatelly.
     *
     * @param cartridge The cartridge image. Can be either
     * an array / typed array of byte values or a base64 encoded string.
     *
     * @param tvMode The TV mode (NTSC / PAL / SECAM)
     *
     * @param config Optional configuration
     * values to customize emulation behavior. See [[CartridgeConfig]] for a full list of supported
     * settings and their defaults.
     *
     * @returns {Promise<Stellerator.State>}
     */
    start(
        cartridge: ArrayLike<number> | string,
        tvMode: Stellerator.TvMode,
        config: Partial<Stellerator.CartridgeConfig> = {}
    ): Promise<Stellerator.State> {
        return this._mutex.runExclusive(async () => {
            if (typeof cartridge === 'string') {
                cartridge = decodeBase64(cartridge);
            }

            const stellaConfig = StellaConfig.create({
                tvMode: this._convertTvMode(tvMode),
                pcmAudio: true
            });

            if (typeof config.randomSeed !== 'undefined' && config.randomSeed > 0) {
                stellaConfig.randomSeed = config.randomSeed;
            }

            if (typeof config.emulatePaddles !== 'undefined') {
                stellaConfig.emulatePaddles = config.emulatePaddles;
            }

            if (typeof config.frameStart !== 'undefined') {
                stellaConfig.frameStart = config.frameStart;
            }

            stellaConfig.cpuType = cpuType(config.cpuAccuracy);

            await this._serviceInitialized;

            return (this._state = this._mapState(
                await this._emulationService.start(
                    cartridge,
                    { ...stellaConfig, asyncIO: config.asyncIO },
                    config.cartridgeType
                )
            ));
        });
    }

    /**
     * Like [[start]], but run the emulator immediatelly instead of starting
     * in paused mode.
     *
     * Just like its counterpart, this method is **async** and returns a promise
     * for the resulting emualtion state.
     *
     * @param cartridge The cartridge image. Can be either
     * an array / typed array of byte values or a base64 encoded string.
     *
     * @param tvMode The TV mode (NTSC / PAL / SECAM)
     *
     * @param config Optional configuration
     * values to customize emulation behavior. See [[CartridgeConfig]] for a full list of supported
     * settings and their defaults.
     *
     * @returns {Promise<Stellerator.State>}
     */
    async run(
        cartridge: ArrayLike<number> | string,
        tvMode: Stellerator.TvMode,
        config: Partial<Stellerator.CartridgeConfig> = {}
    ): Promise<Stellerator.State> {
        if ((await this.start(cartridge, tvMode, config)) === Stellerator.State.paused) {
            return this.resume();
        }
    }

    /**
     * Pause a running emulation session. This method is **async** and returns a
     * promise for the resulting emulation state.
     *
     * @returns {Promise<Stellerator.State>}
     */
    async pause(): Promise<Stellerator.State> {
        await this._serviceInitialized;

        return this._mutex.runExclusive(
            async () => (this._state = this._mapState(await this._emulationService.pause()))
        );
    }

    /**
     * Resume a paused emulation session. This method is **async** and returns a
     * promise for the resulting emulation state.
     *
     * @returns {Promise<Stellerator.State>}
     */
    async resume(): Promise<Stellerator.State> {
        await this._serviceInitialized;

        return this._mutex.runExclusive(
            async () => (this._state = this._mapState(await this._emulationService.resume()))
        );
    }

    /**
     * Stop a running or paused emulation session. This method is **async** and returns a
     * promise for the resulting emulation state.
     *
     * @returns {Promise<Stellerator.State>}
     */
    async stop(): Promise<Stellerator.State> {
        await this._serviceInitialized;

        return this._mutex.runExclusive(
            async () => (this._state = this._mapState(await this._emulationService.stop()))
        );
    }

    /**
     * Reset a running emulation session. This method is **async** and returns a
     * promise for the resulting emulation state.
     *
     * @returns {Promise<Stellerator.State>}
     */
    async reset(): Promise<Stellerator.State> {
        await this._serviceInitialized;

        return this._mutex.runExclusive(
            async () => (this._state = this._mapState(await this._emulationService.reset()))
        );
    }

    /**
     * Retrieve the last emulation error.
     *
     * **IMPORTANT:** Don't use this to check whether an error occurred; use [[getState]]
     * and check for [[State.error]] instead.
     *
     * @returns {Error}
     */
    lastError(): Error {
        return this._emulationService.getLastError();
    }

    asyncIOSend(message: ArrayLike<number>): this {
        this._asyncIO.send(message);

        return this;
    }

    private _convertTvMode(tvMode: Stellerator.TvMode): StellaConfig.TvMode {
        switch (tvMode) {
            case Stellerator.TvMode.ntsc:
                return StellaConfig.TvMode.ntsc;

            case Stellerator.TvMode.pal:
                return StellaConfig.TvMode.pal;

            case Stellerator.TvMode.secam:
                return StellaConfig.TvMode.secam;

            default:
                throw new Error(`invalid TV mode '${tvMode}'`);
        }
    }

    private _createDrivers(): void {
        this._createVideoDriver();

        if (this._config.audio) {
            try {
                this._audioDriver = new AudioDriver();
                this._audioDriver.init();
                this._audioDriver.setMasterVolume(this._config.volume);

                this._driverManager.addDriver(this._audioDriver, context =>
                    this._audioDriver.bind(true, [context.getPCMChannel()])
                );

                this._emulationService.stateChanged.addHandler(newState => {
                    switch (newState) {
                        case EmulationServiceInterface.State.running:
                            this._audioDriver.resume();
                            break;

                        default:
                            this._audioDriver.pause();
                            break;
                    }
                });
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
                this._keyboardIO.toggleFullscreen.addHandler(
                    () => this._fullscreenVideo && this._fullscreenVideo.toggle()
                );
            }

            if (this._config.pauseViaKeyboard) {
                this._keyboardIO.togglePause.addHandler(this._pauseHandler);
            }
        }

        if (this._config.resetViaKeyboard) {
            this._keyboardIO.hardReset.addHandler(() => this.reset());
        }

        if (this._config.enableGamepad) {
            this._gamepad = new Gamepad();
            this._gamepad.init();

            this._driverManager.addDriver(this._gamepad, context =>
                this._gamepad.bind([context.getJoystick(0), context.getJoystick(1)], {
                    [Target.start]: context.getControlPanel().getResetButton(),
                    [Target.select]: context.getControlPanel().getSelectSwitch()
                })
            );
        }

        if (this._config.paddleViaMouse) {
            this._paddle = new Paddle();

            this._driverManager.addDriver(this._paddle, context => this._paddle.bind(context.getPaddle(0)));
        }

        this._asyncIO = new AsyncIO();
        this.asyncIOMessage = this._asyncIO.message;
        this._driverManager.addDriver(this._asyncIO, (context, driver: AsyncIO) => driver.bind(context.getAsyncIO()));
    }

    private _removeVideoDriver(): void {
        if (!this._videoDriver) {
            return;
        }

        this._videoDriver.unbind();

        this._driverManager.removeDriver(this._videoDriver);

        this._fullscreenVideo.disengage();

        this._fullscreenVideo = null;
        this._videoDriver = null;
    }

    private _createVideoDriver(): void {
        if (this._videoDriver) {
            this._removeVideoDriver();
        }

        if (!this._canvasElt) {
            return;
        }

        // FIXME: configuration
        this._videoDriver = new WebglVideo(this._canvasElt).init();

        this._driverManager.addDriver(this._videoDriver, context => this._videoDriver.bind(context.getVideo()));

        this._fullscreenVideo = new FullscreenDriver(this._videoDriver);
    }

    private _removeTouchDriver() {
        if (!this._touchIO) {
            return;
        }

        this._touchIO.unbind();

        this._driverManager.removeDriver(this._touchIO);

        this._touchIO = null;
    }

    private _createTouchDriver() {
        if (this._touchIO) {
            this._removeTouchDriver();
        }
        if (this._config.enableTouch) {
            this._touchIO = new TouchIO(
                this._canvasElt,
                this._config.touchJoystickSensitivity,
                this._config.touchLeftHanded
            );

            this._driverManager.addDriver(this._touchIO, context =>
                this._touchIO.bind(context.getJoystick(0), context.getControlPanel())
            );

            if (this._config.pauseViaTouch) {
                this._touchIO.togglePause.addHandler(this._pauseHandler);
            }

            if (this._config.fullscreenViaTouch) {
                this._touchIO.toggleFullscreen.addHandler(
                    () => this._fullscreenVideo && this._fullscreenVideo.toggle()
                );
            }
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

    private _pauseHandler: () => void = () => {
        switch (this._emulationService.getState()) {
            case EmulationServiceInterface.State.paused:
                this.resume();
                break;

            case EmulationServiceInterface.State.running:
                this.pause();
                break;
        }
    };

    /**
     * Subscribe to this event to receive periodic updates on the frequency of the
     * emulated system. The unit is Hz. Check out the
     * [microevent.ts](https://github.com/DirtyHairy/microevent)
     * documentation on the event API.
     *
     * Example (using JQuery to display emulation speed):
     * ```typescript
     *     stellerator.frequencyUpdate.addHandler(
     *         frequency => $('emulation-speed').text(`System speed: ${(frequency / 1e6).toFixed(2)} MHz`)
     *     );
     * ```
     */
    frequencyUpdate: Event<number>;

    /**
     * Subscribe to this event to receive messages that are sent from the ROM running
     * inside the emulator via the data tap.
     *
     * @type {Event<ArrayLike<number>>}
     * @memberof Stellerator
     */
    asyncIOMessage: Event<ArrayLike<number>>;

    /**
     * This event is dispatched whenever emulation state changes. Check out the
     * [microevent.ts](https://github.com/DirtyHairy/microevent)
     * documentation on the event API.
     *
     * Example (using JQuery to display an error message):
     * ```typescript
     *     stellerator.stateChange.addHandler(
     *         state => {
     *             if (state === Stellerator.State.error) {
     *                  $('error-message').text(stellerator.lastError().message);
     *             }
     *         }
     *     );
     * ```
     */
    stateChange: Event<Stellerator.State>;

    private _canvasElt: HTMLCanvasElement = null;
    private _config: Stellerator.Config = null;
    private _emulationService: EmulationServiceInterface = null;
    private _serviceInitialized: Promise<void> = null;

    private _videoDriver: WebglVideo = null;
    private _fullscreenVideo: FullscreenDriver = null;
    private _audioDriver: AudioDriver = null;
    private _keyboardIO: KeyboardIO = null;
    private _asyncIO: AsyncIO = null;
    private _touchIO: TouchIO = null;
    private _paddle: Paddle = null;
    private _gamepad: Gamepad = null;

    private _controlPanel = new ControlPanelProxy();

    private _state = Stellerator.State.stopped;

    private _driverManager = new DriverManager();

    private _mutex = new Mutex();
}

namespace Stellerator {
    /**
     * General emulator configuration. The configuration is set on construction of the
     * stellerator instance. Each setting is strictly optional and has a default
     * value.
     */
    export interface Config {
        /**
         * Perform smooth scaling of the output image.
         *
         * Default: true
         */
        smoothScaling: boolean;

        /**
         * Simulate persistence of vision / phosphor by blending several frames. This will
         * take effect **only** if WebGL is available.
         *
         * Default: true
         */
        simulatePov: boolean;

        /**
         * Gamma correction. Will take effect **only** if WebGL is available.
         *
         * Default: true
         */
        gamma: number;

        /**
         * Enable audio.
         *
         * Default: true
         */
        audio: boolean;

        /**
         * Master volume.
         *
         * Default: 0.5
         */
        volume: number;

        /**
         * Enable keyboard for joysticks and reset / resume.
         *
         * Default: true
         *
         */
        enableKeyboard: boolean;

        /**
         * Enable touch controls for left joystick and reset / resume.
         *
         * Default: true
         */
        enableTouch: boolean;

        /**
         * Mirror touch controls for left handed users.
         *
         * Default: false
         */
        touchLeftHanded: boolean;

        /**
         * Touch control joystick emulation sensitivity (in pixels).
         *
         * Default: 15
         */
        touchJoystickSensitivity: number;

        /**
         * Specify an HTML element on which the driver listens for keyboard
         * events.
         *
         * Default: document
         */
        keyboardTarget: HTMLElement | HTMLDocument;

        /**
         * Toggle fullscreen with "enter". Applicable **only** if `enableKeyboard`
         * is set.
         *
         * Default: true
         */
        fullscreenViaKeyboard: boolean;

        /**
         * Toggle pause with "p". Applicable **only** if `enableKeyboard` is set.
         *
         * Default: true
         */
        pauseViaKeyboard: boolean;

        /**
         * Reset emulation with "shift-r".
         *
         * Default: true
         */
        resetViaKeyboard: boolean;

        /**
         * Toggle pause via touch controls. Applicable **only** if `enableTouch` is set.
         *
         * Default: true
         */
        pauseViaTouch: boolean;

        /**
         * Toggle fullscreen via touch controls. Applicable **only** if `enableTouch` is set.
         */
        fullscreenViaTouch: boolean;

        /**
         * Emulate the first paddlewith the horizontal movement of the mouse.
         *
         * Default: true
         *
         */
        paddleViaMouse: boolean;

        /**
         * Enable gamepad support.
         *
         * Default: true
         */
        enableGamepad: boolean;
    }

    /**
     * TV mode constants
     */
    export enum TvMode {
        /**
         * NTSC
         */
        ntsc = 'ntsc',
        /**
         * PAL
         */
        pal = 'pal',
        /**
         * SECAM
         */
        secam = 'secam'
    }

    /**
     * Optional configuration for a specific cartridge. This configuration is passed to
     * the emulator together with a cartridge image for emulation. Each setting
     * is strictly optional and has a default value.
     */
    export interface CartridgeConfig {
        /**
         * Specify the cartridge type. The default is autodetection which should
         * work fine in almost all cases.
         *
         * Default: undefined [autodetect]
         */
        cartridgeType: CartridgeInfo.CartridgeType;

        /**
         * Random number generator seed. This is used to initialize the initial
         * hardware state. The default is automatic, which uses a random seed.
         *
         * Default: undefined [automatic]
         */
        randomSeed: number;

        /**
         * Emulate paddles.
         *
         * Default: true
         */
        emulatePaddles: boolean;

        /**
         * The first visible scanline of the frame. The default is autodetection, which
         * should work fine for most cases.
         *
         * Default: undefined [autodetect]
         */
        frameStart: number;

        /**
         * The accuracy of the CPU core (see below).
         *
         * Default: cycle (high precision)
         */
        cpuAccuracy: CpuAccuracy;

        /**
         * Enable the data tap.
         *
         * Default: false
         */
        asyncIO: boolean;
    }

    /**
     * The CartridgeType enum. Reexported from the `CartridgeInfo` module. Please check the
     * [source](https://github.com/6502ts/6502.ts/blob/master/src/machine/stella/cartridge/CartridgeInfo.ts)
     * for the various possible values if you really need this setting.
     *
     * Example:
     * ```typescript
     *     stellerator.run(cartridgeImage, Stellerator.TvMode.ntsc, {
     *         cartridgeType: Stellerator.CartridgeType.bankswitch_DPC
     *     });
     * ```
     */
    export const CartridgeType = CartridgeInfo.CartridgeType;

    /**
     * This function takes a cartridge type and returns a human readable
     * description suitable for building an UI. Reexported from the `CartridgeInfo` module.
     *
     * Example:
     * ```typescript
     *     const description = Stellerator.describeCartridgeType(
     *         Stellerator.CartridgeType.bankswitch_DPC
     *     );
     * ```
     */
    export const describeCartridgeType: (cartridgeType: CartridgeInfo.CartridgeType) => string =
        CartridgeInfo.describeCartridgeType;

    /**
     * This function returns an array of all possible cartridge types suitable for building an UI.
     * Reexported from the `CartridgeInfo` module.
     */
    export const allCartridgeTypes: () => Array<CartridgeInfo.CartridgeType> = CartridgeInfo.getAllTypes;

    /**
     * The different possible states of the emulation.
     */
    export enum State {
        running = 'running',
        /**
         * Emulation has been paused and can be stopped or continued.
         */
        paused = 'paused',
        /**
         * Emulation has been stopped regularily.
         */
        stopped = 'stopped',
        /**
         * Emulation has been stopped by an error.
         */
        error = 'error'
    }

    /**
     * The different possible CPU emulation modes.
     */
    export enum CpuAccuracy {
        /**
         * True cycle-exact CPU emulation. High accuracy.
         */
        cycle = 'cycle',
        /**
         * Less accurate memory access patters. Slightly less accurate, but faster
         */
        instruction = 'instruction'
    }
}

export { Stellerator as default };
