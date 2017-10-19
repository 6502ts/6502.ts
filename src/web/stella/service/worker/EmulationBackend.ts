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

import EmulationService from '../vanilla/EmulationService';
import EmulationServiceInterface from '../EmulationServiceInterface';
import { RpcProviderInterface } from 'worker-rpc';
import DriverManager from '../DriverManager';
import VideoDriver from './VideoDriver';
import ControlDriver from './ControlDriver';
import AudioDriver from './AudioDriver';
import EmulationContext from '../vanilla/EmulationContext';

import { RPC_TYPE, SIGNAL_TYPE, EmulationStartMessage, EmulationParametersResponse, SetupMessage } from './messages';

class EmulationBackend {
    constructor(private _rpc: RpcProviderInterface) {
        this._service = new EmulationService();
    }

    startup(): void {
        this._rpc
            .registerRpcHandler(RPC_TYPE.setup, this._onSetup.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationFetchLastError, this._onFetchLastError.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationGetParameters, this._onEmulationGetParameters.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationPause, this._onEmulationPause.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationReset, this._onEmulationReset.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationResume, this._onEmulationResume.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationSetRateLimit, this._onEmulationSetRateLimit.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationStart, this._onEmulationStart.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationStop, this._onEmulationStop.bind(this));

        this._service.frequencyUpdate.addHandler(EmulationBackend._onFrequencyUpdate, this);
        this._service.emulationError.addHandler(EmulationBackend._onEmulationError, this);

        const driverManager = new DriverManager(),
            videoDriver = new VideoDriver(this._rpc),
            controlDriver = new ControlDriver(this._rpc),
            audioDrivers = [new AudioDriver(0, this._rpc), new AudioDriver(1, this._rpc)];

        this._videoDriver = videoDriver;
        controlDriver.init();

        driverManager
            .addDriver(videoDriver, (context: EmulationContext, driver: VideoDriver) =>
                driver.bind(context.getRawVideo())
            )
            .addDriver(controlDriver, (context: EmulationContext, driver: ControlDriver) => driver.bind(context))
            .bind(this._service);

        for (let i = 0; i < 2; i++) {
            driverManager.addDriver(audioDrivers[i], (context: EmulationContext, driver: AudioDriver) =>
                driver.bind(i === 0 ? context.getAudio().channel0 : context.getAudio().channel1)
            );
        }
    }

    private static _onFrequencyUpdate(frequency: number, self: EmulationBackend): void {
        self._rpc.signal<number>(SIGNAL_TYPE.emulationFrequencyUpdate, frequency);
    }

    private static _onEmulationError(error: Error, self: EmulationBackend): void {
        self._rpc.signal<string>(SIGNAL_TYPE.emulationError, error ? error.message : null);
    }

    private _onSetup(msg: SetupMessage): void {
        this._videoDriver.init(msg.videoProcessorPort);
    }

    private _onFetchLastError(): string {
        const lastError = this._service.getLastError();

        return lastError ? lastError.message : null;
    }

    private _onEmulationPause(): Promise<EmulationServiceInterface.State> {
        return this._service.pause();
    }

    private _onEmulationReset(): Promise<EmulationServiceInterface.State> {
        return this._service.reset();
    }

    private _onEmulationResume(): Promise<EmulationServiceInterface.State> {
        return this._service.resume();
    }

    private _onEmulationStart(message: EmulationStartMessage): Promise<EmulationServiceInterface.State> {
        this._videoDriver.setVideoProcessingConfig(message.videoProcessing);

        return this._service.start(message.buffer, message.config, message.cartridgeType);
    }

    private _onEmulationStop(): Promise<EmulationServiceInterface.State> {
        return this._service.stop();
    }

    private _onEmulationSetRateLimit(message: boolean): Promise<void> {
        return this._service.setRateLimit(message);
    }

    private _onEmulationGetParameters(): Promise<EmulationParametersResponse> {
        const context = this._service.getEmulationContext(),
            audio = context.getAudio(),
            video = context && context.getRawVideo();

        return Promise.resolve({
            width: video ? video.getWidth() : 0,
            height: video ? video.getHeight() : 0,
            volume: [audio.channel0.getVolume(), audio.channel1.getVolume()]
        });
    }

    private _service: EmulationService;
    private _videoDriver: VideoDriver = null;
}

export default EmulationBackend;
