import * as path from 'path';

import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';
import DebuggerCLI from './DebuggerCLI';

import Board from '../machine/stella/Board';
import CartridgeInterface from '../machine/stella/CartridgeInterface';
import Cartridge4k from '../machine/stella/Cartridge4k';
import StellaConfig from '../machine/stella/Config';
import VideoOutputInterface from '../machine/io/VideoOutputInterface';

import CommandInterpreter from './CommandInterpreter';
import ImmedateScheduler from '../tools/scheduler/ImmedateScheduler';
import TaskInterface from '../tools/scheduler/TaskInterface';
import PeriodicScheduler from '../tools/scheduler/PeriodicScheduler';

import ClockProbe from '../tools/ClockProbe';

const enum State {debug, run};

const CLOCK_PROBE_INTERVAL = 1000;

class StellaCLI extends DebuggerCLI {

    constructor(fsProvider: FilesystemProviderInterface, protected _cartridgeFile: string) {
        super(fsProvider);

        this._commandInterpreter.registerCommands({
            run: () => (this._setState(State.run), 'running...')
        });

        this._runModeCommandInterpreter = new CommandInterpreter({
            stop: () => (this._setState(State.debug), 'stopped, entered debugger')
        });
    }

    getVideoOutput(): VideoOutputInterface {
        return this._board.getVideoOutput();
    }

    getPrompt(): string {
        const frequency = this._clockProbe.getFrequency(),
            prefix = frequency > 0 ? `${(frequency / 1000000).toFixed(2)} MHz ` : '';

        switch (this._state) {
            case State.debug:
                return `${prefix}[debug] > `;

            case State.run:
                return `${prefix}[run] > `;

            default:
                throw new Error('invalid run state');
        }
    }

    protected _getCommandInterpreter(): CommandInterpreter {
        switch (this._state) {
            case State.debug:
                return super._getCommandInterpreter();

            case State.run:
                return this._runModeCommandInterpreter;

            default:
                throw new Error('invalid run state');
        }
    }

    protected _initializeHardware(): void {
        const fileBuffer = this._fsProvider.readBinaryFileSync(this._cartridgeFile),
            cartridge = new Cartridge4k(fileBuffer),
            config = new StellaConfig(StellaConfig.TvMode.ntsc),
            board = new Board(config, cartridge);

        this._board = board;
        this._cartridge = cartridge;

        const clockProbe = new ClockProbe(new PeriodicScheduler(CLOCK_PROBE_INTERVAL));
        clockProbe.attach(this._board.clock);
        clockProbe.frequencyUpdate.addHandler(() => this.events.promptChanged.dispatch(undefined));

        this._clockProbe = clockProbe;
    }

    protected _setState(state: State) {
        if (state === this._state) {
            return;
        }

        this._state = state;
        this.events.availableCommandsChanged.dispatch(undefined);
        this.events.promptChanged.dispatch(undefined);

        switch (state) {
            case State.debug:
                this._clockProbe.stop();
                this._board.getTimer().stop();
                break;

            case State.run:
                this._clockProbe.start();
                this._board.getTimer().start(this._scheduler);
                break;
        }
    }

    protected _board: Board;
    protected _cartridge: CartridgeInterface;
    protected _runModeCommandInterpreter: CommandInterpreter;

    protected _scheduler = new ImmedateScheduler();
    protected _clockProbe: ClockProbe;

    protected _state = State.debug;
}

export default StellaCLI;
