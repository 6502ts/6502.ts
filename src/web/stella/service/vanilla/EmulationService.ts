import {Event, EventInterface} from 'microevent.ts';

import EmulationServiceInterface from '../EmulationServiceInterface';
import EmulationContext from './EmulationContext';
import Board from '../../../../machine/stella/Board';
import BoardInterface from '../../../../machine/board/BoardInterface';
import StellaConfig from '../../../../machine/stella/Config';
import CartridgeFactory from '../../../../machine/stella/cartridge/CartridgeFactory';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';
import ImmediateScheduler from '../../../../tools/scheduler/ImmedateScheduler';
import LimitingScheduler from '../../../../tools/scheduler/LimitingImmediateScheduler';
import SchedulerInterface from '../../../../tools/scheduler/SchedulerInterface';
import ClockProbe from '../../../../tools/ClockProbe';
import PeriodicScheduler from '../../../../tools/scheduler/PeriodicScheduler';
import Mutex from '../../../../tools/Mutex';

const CLOCK_UPDATE_INTERVAL = 2000;

export default class EmulationService implements EmulationServiceInterface {

    constructor() {
        this.frequencyUpdate = this._clockProbe.frequencyUpdate;
        this._updateScheduler();
    }

    init(): Promise<void> {
        return Promise.resolve();
    }

    start(
        buffer: {[i: number]: number, length: number},
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<EmulationServiceInterface.State>
    {
        const factory = new CartridgeFactory();

        return this._mutex.runExclusive(() => {
            try {
                this._stop();

                if (this._state === EmulationServiceInterface.State.error) {
                    return this._state;
                }

                const cartridge = factory.createCartridge(buffer, cartridgeType),
                    board = new Board(config, cartridge);

                this._board = board;
                this._board.trap.addHandler(EmulationService._trapHandler, this);
                this._context = new EmulationContext(board);

                this._clockProbe
                    .attach(this._board.clock);

                this._setState(EmulationServiceInterface.State.paused);
            } catch (e) {
                this._setError(e);
            }

            return this._state;
        });
    }

    stop(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => this._stop());
    }

    pause(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => {
            try {
                if (this._state === EmulationServiceInterface.State.running) {
                    this._board.getTimer().stop();
                    this._board.suspend();
                    this._setState(EmulationServiceInterface.State.paused);

                    this._clockProbe.stop();
                }
            } catch (e) {
                this._setError(e);
            }

            return this._state;
        });
    }

    resume(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => {
            if (this._state === EmulationServiceInterface.State.paused) {
                try {
                    this._tryToResume();
                }
                catch (e) {
                    this._setError(e);
                }

            }

            return this._state;
        });
    }

    reset(): Promise<EmulationServiceInterface.State> {
        return this._mutex.runExclusive(() => {
            try {
                switch (this._state) {
                    case EmulationServiceInterface.State.running:
                    case EmulationServiceInterface.State.paused:
                        this._board.reset();

                        break;

                    case EmulationServiceInterface.State.error:
                        this._board.reset();
                        this._tryToResume();

                        break;
                }
            }
            catch (e) {
                this._setError(e);
            }

            return this._state;
        });
    }

    getState(): EmulationServiceInterface.State {
        return this._state;
    }

    getEmulationContext(): EmulationContext {
        switch (this._state) {
            case EmulationServiceInterface.State.running:
            case EmulationServiceInterface.State.paused:
                return this._context;

            default:
                return null;
        }
    }

    getLastError(): Error {
        return this._lastError;
    }

    getFrequency(): number {
        return this._clockProbe.getFrequency();
    }

    getRateLimit(): boolean {
        return this._enforceRateLimit;
    }

    setRateLimit(enforce: boolean): Promise<void> {
        if (this._enforceRateLimit === enforce) {
            return Promise.resolve(undefined);
        }

        return this._mutex.runExclusive(() => {
            if (this._state === EmulationServiceInterface.State.running) {
                this._board.getTimer().stop();
            }

            this._enforceRateLimit = enforce;
            this._updateScheduler();

            if (this._state === EmulationServiceInterface.State.running) {
                this._board.getTimer().start(this._scheduler);
            }
        });
    }

    private _stop(): EmulationServiceInterface.State {
        try {
            if (this._state === EmulationServiceInterface.State.running) {
                this._board.getTimer().stop();
                this._board.suspend();
                this._board.trap.removeHandler(EmulationService._trapHandler, this);

                this._clockProbe
                    .stop()
                    .detach();
            }
            this._board = null;

            this._context = null;
            this._setState(EmulationServiceInterface.State.stopped);
        } catch (e) {
            this._setError(e);
        }

        return this._state;
    }

    private _tryToResume(): void {
            if (this._state === EmulationServiceInterface.State.running) {
                return;
            }

            this._board.getTimer().start(this._scheduler);
            this._board.resume();
            this._setState(EmulationServiceInterface.State.running);

            this._clockProbe.start();
    }

    private _setError(e: Error): void {
        this._lastError = e;
        this._setState(EmulationServiceInterface.State.error);
    }

    private _setState(state: EmulationServiceInterface.State): EmulationServiceInterface.State {
        if (state !== this._state) {
            this._state = state;
            this.stateChanged.dispatch(state);
        }

        return this._state;
    }

    private static _trapHandler(trap: BoardInterface.TrapPayload, self: EmulationService) {
        self._setError(new Error(`TRAP: ${trap.message}`));
        self.emulationError.dispatch(self._lastError);
    }

    private _updateScheduler(): void {
        this._scheduler = this._enforceRateLimit ? new LimitingScheduler() : new ImmediateScheduler();
    }

    stateChanged = new Event<EmulationServiceInterface.State>();
    emulationError = new Event<Error>();
    frequencyUpdate: EventInterface<number>;

    private _enforceRateLimit = true;
    private _state = EmulationServiceInterface.State.stopped;
    private _lastError: Error = null;
    private _board: Board;
    private _context: EmulationContext;
    private _scheduler: SchedulerInterface = null;
    private _clockProbe = new ClockProbe(new PeriodicScheduler(CLOCK_UPDATE_INTERVAL));
    private _mutex = new Mutex();

}
