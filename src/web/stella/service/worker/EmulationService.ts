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

import { Event } from 'microevent.ts';
import { RpcProvider } from 'worker-rpc';

import EmulationServiceInterface from '../EmulationServiceInterface';
import EmulationContext from './EmulationContext';
import EmulationContextInterface from '../EmulationContextInterface';
import { ProcessorConfig as VideoProcessorConfig } from '../../../../video/processing/config';
import VideoProxy from './VideoProxy';
import ControlProxy from './ControlProxy';
import WaveformAudioProxy from './WaveformAudioProxy';
import PCMAudioProxy from './PCMAudioProxy';

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

import { Mutex } from 'async-mutex';

import { RPC_TYPE, SIGNAL_TYPE, EmulationStartMessage, SetupMessage } from './messages';

const CONTROL_PROXY_UPDATE_INTERVAL = 25;

const enum ProxyState {
    stopped,
    running,
    paused
}

class EmulationService implements EmulationServiceInterface {
    constructor(private _stellaWorkerUri: string, private _videoWorkerUri?: string) {}

    init(): Promise<void> {
        this._worker = new Worker(this._stellaWorkerUri);
        this._rpc = new RpcProvider((message, transfer?) => this._worker.postMessage(message, transfer));

        this._pcmChannel = new PCMAudioProxy(0, this._rpc).init();

        for (let i = 0; i < 2; i++) {
            this._waveformChannels[i] = new WaveformAudioProxy(i, this._rpc).init();
        }

        const videoProxy = new VideoProxy(this._rpc),
            controlProxy = new ControlProxy(this._rpc);

        videoProxy.init();

        this._emulationContext = new EmulationContext(
            videoProxy,
            controlProxy,
            this._waveformChannels,
            this._pcmChannel
        );

        this._worker.onmessage = messageEvent => this._rpc.dispatch(messageEvent.data);

        this._rpc
            .registerSignalHandler<number>(SIGNAL_TYPE.emulationFrequencyUpdate, this._onFrequencyUpdate.bind(this))
            .registerSignalHandler<string>(SIGNAL_TYPE.emulationError, this._onEmulationError.bind(this));

        this._controlProxy = controlProxy;

        return this._startVideoProcessingPipeline().then(() => this.setRateLimit(this._rateLimitEnforced));
    }

    async start(
        buffer: { [i: number]: number; length: number },
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType,
        videoProcessing?: Array<VideoProcessorConfig>
    ): Promise<EmulationServiceInterface.State> {
        await this.stop();

        return this._mutex.runExclusive(async () => {
            const state = await this._rpc.rpc<EmulationStartMessage, EmulationServiceInterface.State>(
                RPC_TYPE.emulationStart,
                {
                    buffer,
                    config,
                    cartridgeType,
                    videoProcessing
                }
            );

            if (state === EmulationServiceInterface.State.paused) {
                this._saveConfig = config;
                this._emulationContext.setConfig(config);

                await this._startProxies(config);
            } else {
                this._saveConfig = null;
            }

            return this._applyState(state);
        });
    }

    pause(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() =>
            this._rpc.rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationPause).then(state => {
                this._pauseProxies();
                return this._applyState(state);
            })
        );
    }

    stop(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() =>
            this._rpc.rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationStop).then(state => {
                this._stopProxies();
                return this._applyState(state);
            })
        );
    }

    reset(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(async () => {
            const state = await this._rpc.rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationReset);

            // Try to restart the proxies if the reset recovered from an an error
            if (
                this._state === EmulationServiceInterface.State.error &&
                (state === EmulationServiceInterface.State.running ||
                    state === EmulationServiceInterface.State.paused) &&
                this._saveConfig
            ) {
                await this._startProxies(this._saveConfig);
            }

            return this._applyState(state);
        });
    }

    resume(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() =>
            this._rpc.rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationResume).then(state => {
                this._resumeProxies();
                return this._applyState(state);
            })
        );
    }

    setRateLimit(enforce: boolean): Promise<void> {
        this._rateLimitEnforced = enforce;

        return this._rpc.rpc<boolean, void>(RPC_TYPE.emulationSetRateLimit, enforce);
    }

    getFrequency(): number {
        return this._frequency;
    }

    getRateLimit(): boolean {
        return this._rateLimitEnforced;
    }

    getState(): EmulationServiceInterface.State {
        return this._state;
    }

    getLastError(): Error {
        return this._lastError;
    }

    getEmulationContext(): EmulationContextInterface {
        switch (this._state) {
            case EmulationServiceInterface.State.running:
            case EmulationServiceInterface.State.paused:
                return this._emulationContext;

            default:
                return null;
        }
    }

    private _fetchLastError(): Promise<Error> {
        return this._rpc
            .rpc<void, string>(RPC_TYPE.emulationFetchLastError)
            .then(message => (message ? new Error(message) : null));
    }

    private _applyState(
        state: EmulationServiceInterface.State
    ): Promise<EmulationServiceInterface.State> | EmulationServiceInterface.State {
        if (state === EmulationServiceInterface.State.error) {
            return this._fetchLastError().then(error => {
                this._state = state;
                this._lastError = error;

                this._stopProxies();

                this.stateChanged.dispatch(state);

                return state;
            });
        } else {
            this._state = state;
            this.stateChanged.dispatch(state);

            return state;
        }
    }

    private _onFrequencyUpdate(message: number): void {
        this._frequency = message;
        this.frequencyUpdate.dispatch(this._frequency);
    }

    private _onEmulationError(message: string): void {
        this._lastError = new Error(message || '');

        this._stopProxies();
        this._state = EmulationServiceInterface.State.error;
        this.stateChanged.dispatch(this._state);
    }

    private async _startProxies(config: StellaConfig): Promise<void> {
        await this._emulationContext.getVideoProxy().start();

        for (let i = 0; i < this._waveformChannels.length; i++) {
            await this._waveformChannels[i].start(config);
        }
        await this._pcmChannel.start();

        this._startControlUpdates();

        this._proxyState = ProxyState.running;
    }

    private _stopProxies(): void {
        if (this._proxyState === ProxyState.stopped) {
            return;
        }

        this._emulationContext.getVideoProxy().stop();
        this._pcmChannel.stop();
        this._stopControlUpdates();

        this._proxyState = ProxyState.stopped;
    }

    private _pauseProxies(): void {
        if (this._proxyState !== ProxyState.running) {
            return;
        }

        this._stopControlUpdates();

        this._proxyState = ProxyState.paused;
    }

    private _resumeProxies(): void {
        if (this._proxyState !== ProxyState.paused) {
            return;
        }

        this._startControlUpdates();

        this._proxyState = ProxyState.running;
    }

    private _startControlUpdates(): void {
        if (this._controlProxyUpdateHandle === null) {
            this._controlProxyUpdateHandle = setInterval(
                () => this._controlProxy.sendUpdate(),
                CONTROL_PROXY_UPDATE_INTERVAL
            );
        }
    }

    private _stopControlUpdates(): void {
        if (this._controlProxyUpdateHandle !== null) {
            clearInterval(this._controlProxyUpdateHandle);
            this._controlProxyUpdateHandle = null;
        }
    }

    private async _startVideoProcessingPipeline(): Promise<void> {
        let channel: MessageChannel = null;

        if (this._videoWorkerUri) {
            channel = new MessageChannel();

            const worker = new Worker(this._videoWorkerUri),
                rpc = new RpcProvider((payload: any, transfer?: any) => worker.postMessage(payload, transfer));

            worker.onmessage = (e: MessageEvent) => rpc.dispatch(e.data);

            await rpc.rpc('/use-port', channel.port1, [channel.port1]);
        }

        await this._rpc.rpc<SetupMessage, any>(
            RPC_TYPE.setup,
            {
                videoProcessorPort: channel && channel.port2
            },
            channel ? [channel.port2] : []
        );
    }

    stateChanged = new Event<EmulationServiceInterface.State>();
    frequencyUpdate = new Event<number>();

    private _rateLimitEnforced = true;

    private _mutex = new Mutex();
    private _worker: Worker = null;
    private _rpc: RpcProvider = null;

    private _state = EmulationServiceInterface.State.stopped;
    private _lastError: Error = null;

    private _emulationContext: EmulationContext = null;
    private _frequency = 0;

    private _waveformChannels = new Array<WaveformAudioProxy>(2);
    private _pcmChannel: PCMAudioProxy = null;

    private _controlProxy: ControlProxy = null;
    private _controlProxyUpdateHandle: any = null;
    private _proxyState = ProxyState.stopped;

    private _saveConfig: StellaConfig = null;
}

export { EmulationService as default };
