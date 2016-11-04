import {Event} from 'microevent.ts';

import {RpcProvider} from 'worker-rpc';
import EmulationServiceInterface from '../EmulationServiceInterface';
import EmulationContext from './EmulationContext';
import EmulationContextInterface from '../EmulationContextInterface';
import VideoProxy from './VideoProxy';
import ControlProxy from './ControlProxy';
import AudioProxy from './AudioProxy';

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

import {Mutex} from 'async-mutex';

import {
    RPC_TYPE,
    SIGNAL_TYPE,
    EmulationStartMessage,
    EmulationParametersResponse
} from './messages';

const CONTROL_PROXY_UPDATE_INTERVAL = 25;

const enum ProxyState {
    stopped,
    running,
    paused
}

class EmulationService implements EmulationServiceInterface {

    constructor(
        private _url: string
    ) {}

    init(): Promise<void> {
        this._worker = new Worker(this._url);
        this._rpc = new RpcProvider(
            (message, transfer?) => this._worker.postMessage(message, transfer)
        );

        this._audioChannels = [
            new AudioProxy(0, this._rpc).init(),
            new AudioProxy(1, this._rpc).init()
        ];

        const videoProxy = new VideoProxy(this._rpc),
            controlProxy = new ControlProxy(this._rpc);

        videoProxy.init();

        this._emulationContext = new EmulationContext(
            videoProxy,
            controlProxy,
            this._audioChannels
        );

        this._worker.onmessage = messageEvent => this._rpc.dispatch(messageEvent.data);

        this._rpc
            .registerSignalHandler<number>(SIGNAL_TYPE.emulationFrequencyUpdate, this._onFrequencyUpdate.bind(this))
            .registerSignalHandler<string>(SIGNAL_TYPE.emulationError, this._onEmulationError.bind(this));

        this._controlProxy = controlProxy;

        return this.setRateLimit(this._rateLimitEnforced);
    }

    start(
        buffer: {[i: number]: number, length: number},
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<EmulationServiceInterface.State>
    {
        let state: EmulationServiceInterface.State;

        return this._mutex.runExclusive(() => this._rpc
            .rpc<EmulationStartMessage, EmulationServiceInterface.State>(
                RPC_TYPE.emulationStart,
                {buffer, config, cartridgeType}
            )
            .then(_state => {
                state = _state;

                return this._rpc.rpc<void, EmulationParametersResponse>(
                    RPC_TYPE.emulationGetParameters
                );
            })
            .then(
                emulationParameters => {
                    this._saveConfig = config;
                    this._savedParameters = emulationParameters;

                    return this._startProxies(emulationParameters, config);
                },
                e => {
                    this._saveConfig = null;
                    this._savedParameters = null;

                    return this._rpc
                        .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationStop)
                        .then(() => Promise.reject(e), () => Promise.reject(e));
                }
            )
            .then(() => this._applyState(state))
        );
    }

    pause(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationPause)
            .then(state => {
                this._pauseProxies();
                this._applyState(state);
            })
        );
    }

    stop(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationStop)
            .then(state => {
                this._stopProxies();
                this._applyState(state);
            })
        );
    }

    reset(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationReset)
            .then(state => {
                // Try to restart the proxies if the reset recovered from an an error
                if (this._state === EmulationServiceInterface.State.error && (
                        state === EmulationServiceInterface.State.running ||
                        state === EmulationServiceInterface.State.paused
                    ) &&
                    this._saveConfig &&
                    this._savedParameters
                ) {
                    this._startProxies(this._savedParameters, this._saveConfig);
                }

                return this._applyState(state);
            })
        );
    }

    resume(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationResume)
            .then(state => {
                this._resumeProxies();
                this._applyState(state);
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
            .then(message => message ? new Error(message) : null);
    }

    private _applyState(state: EmulationServiceInterface.State):
        Promise<EmulationServiceInterface.State>|EmulationServiceInterface.State
    {
        if (state === EmulationServiceInterface.State.error) {
            return this
                ._fetchLastError()
                .then(error => {
                    this._state = state;
                    this._lastError = error = error;

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

    private _startProxies(parameters: EmulationParametersResponse, config: StellaConfig): void {
        this._emulationContext.getVideoProxy().enable(parameters.width, parameters.height);

        for (let i = 0; i < this._audioChannels.length; i++) {
            this._audioChannels[i].setConfig(config);
            this._audioChannels[i].setVolume(parameters.volume[i]);
        }

        this._startControlUpdates();
    }

    private _stopProxies(): void {
        if (this._proxyState === ProxyState.stopped) {
            return;
        }

        this._emulationContext.getVideoProxy().disable();

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

    private _audioChannels: Array<AudioProxy>;

    private _controlProxy: ControlProxy = null;
    private _controlProxyUpdateHandle: any = null;
    private _proxyState = ProxyState.stopped;

    private _savedParameters: EmulationParametersResponse = null;
    private _saveConfig: StellaConfig = null;
}

export default EmulationService;
