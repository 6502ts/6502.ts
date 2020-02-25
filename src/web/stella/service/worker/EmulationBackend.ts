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

import EmulationService from '../vanilla/EmulationService';
import EmulationServiceInterface from '../EmulationServiceInterface';
import { RpcProviderInterface } from 'worker-rpc';
import DriverManager from '../DriverManager';
import VideoDriver from './VideoDriver';
import ControlDriver from './ControlDriver';
import WaveformAudioDriver from './WaveformAudioDriver';
import PCMAudioDriver from './PCMAudioDriver';
import EmulationContext from '../vanilla/EmulationContext';
import AsyncIODriver from '../../../driver/AsyncIO';

import { RPC_TYPE, SIGNAL_TYPE, EmulationStartMessage, SetupMessage, MessageToAsyncIOMessage } from './messages';

class EmulationBackend {
    constructor(private _rpc: RpcProviderInterface) {
        this._service = new EmulationService();
    }

    startup(): void {
        const driverManager = new DriverManager(),
            videoDriver = new VideoDriver(this._rpc),
            controlDriver = new ControlDriver(this._rpc),
            waveformAduioDrivers = [0, 1].map(i => new WaveformAudioDriver(i, this._rpc)),
            pcmAudioDriver = new PCMAudioDriver(0, this._rpc),
            asyncIODriver = new AsyncIODriver();

        this._rpc
            .registerRpcHandler(RPC_TYPE.setup, this._onSetup.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationFetchLastError, this._onFetchLastError.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationPause, this._onEmulationPause.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationReset, this._onEmulationReset.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationResume, this._onEmulationResume.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationSetRateLimit, this._onEmulationSetRateLimit.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationStart, this._onEmulationStart.bind(this))
            .registerRpcHandler(RPC_TYPE.emulationStop, this._onEmulationStop.bind(this))
            .registerSignalHandler<MessageToAsyncIOMessage>(SIGNAL_TYPE.messageToAsyncIO, data =>
                asyncIODriver.send(data)
            );

        asyncIODriver.message.addHandler(message => this._rpc.signal(SIGNAL_TYPE.messageFromAsyncIO, message));

        this._service.frequencyUpdate.addHandler(EmulationBackend._onFrequencyUpdate, this);
        this._service.emulationError.addHandler(EmulationBackend._onEmulationError, this);

        this._videoDriver = videoDriver;
        controlDriver.init();

        driverManager
            .addDriver(videoDriver, (context: EmulationContext, driver: VideoDriver) =>
                driver.bind(context.getRawVideo())
            )
            .addDriver(controlDriver, (context: EmulationContext, driver: ControlDriver) => driver.bind(context))
            .addDriver(pcmAudioDriver, (context: EmulationContext, driver: PCMAudioDriver) =>
                driver.bind(context.getPCMChannel())
            )
            .addDriver(asyncIODriver, (context: EmulationContext, driver: AsyncIODriver) =>
                driver.bind(context.getAsyncIO())
            )
            .bind(this._service);

        for (let i = 0; i < 2; i++) {
            driverManager.addDriver(waveformAduioDrivers[i], (context: EmulationContext, driver: WaveformAudioDriver) =>
                driver.bind(context.getWaveformChannels()[i])
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

    private _service: EmulationService;
    private _videoDriver: VideoDriver = null;
}

export { EmulationBackend as default };
