import RpcProvider from '../../../../tools/worker/RpcProvider';
import EmulationServiceInterface from '../EmulationServiceInterface';
import EmulationContext from './EmulationContext';
import EmulationContextInterface from '../EmulationContextInterface';

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

import Event from '../../../../tools/event/Event';
import Mutex from '../../../../tools/Mutex';

import {
    RPC_TYPE,
    SIGNAL_TYPE,
    EmulationStartMessage
} from './messages';

class EmulationService implements EmulationServiceInterface {

    constructor(
        private _url: string
    ) {}

    init(): Promise<void> {
        this._worker = new Worker(this._url);
        this._rpc = new RpcProvider(
            (message, transfer?) => this._worker.postMessage(message, transfer)
        );

        this._worker.onmessage = messageEvent => this._rpc.dispatch(messageEvent.data);

        this._rpc
            .registerSignalHandler<number>(SIGNAL_TYPE.emulationFrequencyUpdate, this._onFrequencyUpdate.bind(this));

        return this.setRateLimit(this._rateLimitEnforced);
    }

    start(
        buffer: {[i: number]: number, length: number},
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<EmulationServiceInterface.State>
    {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<EmulationStartMessage, EmulationServiceInterface.State>(
                RPC_TYPE.emulationStart,
                {buffer, config, cartridgeType}
            )
            .then(state => this._applyState(state))
        );
    }

    pause(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationPause)
            .then(state => this._applyState(state))
        );
    }

    stop(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationStop)
            .then(state => this._applyState(state))
        );
    }

    reset(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationReset)
            .then(state => this._applyState(state))
        );
    }

    resume(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._rpc
            .rpc<void, EmulationServiceInterface.State>(RPC_TYPE.emulationResume)
            .then(state => this._applyState(state))
        );
    }

    setRateLimit(enforce: boolean): Promise<void> {
        this._rateLimitEnforced = enforce;

        return this._rpc.rpc<boolean, void>(RPC_TYPE.emulationSetRateLimit, enforce);
    }

    getFrequency(): number {
        return this._frequency;
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
                    this.stateChanged.dispatch(state);

                    return state;
                });
        } else {
            this._state = state;
            this.stateChanged.dispatch(state);

            return state;
        }
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
        return this._emulationContext;
    }

    private _onFrequencyUpdate(message: number): void {
        this._frequency = message;
        this.frequencyUpdate.dispatch(this._frequency);
    }

    stateChanged = new Event<EmulationServiceInterface.State>();
    frequencyUpdate = new Event<number>();

    private _rateLimitEnforced = true;

    private _mutex = new Mutex();
    private _worker: Worker = null;
    private _rpc: RpcProvider = null;

    private _state = EmulationServiceInterface.State.stopped;
    private _lastError: Error = null;

    private _emulationContext = new EmulationContext();
    private _frequency = 0;

}

export default EmulationService;
