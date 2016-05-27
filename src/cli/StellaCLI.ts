import * as path from 'path';

import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';
import DebuggerCLI from './DebuggerCLI';

import BoardInterface from '../machine/board/BoardInterface';
import Board from '../machine/stella/Board';
import CartridgeInterface from '../machine/stella/CartridgeInterface';
import Cartridge4k from '../machine/stella/Cartridge4k';
import StellaConfig from '../machine/stella/Config';
import VideoOutputInterface from '../machine/io/VideoOutputInterface';

import CommandInterpreter from './CommandInterpreter';
import ImmedateScheduler from '../tools/scheduler/ImmedateScheduler';
import LimitedScheduler from '../tools/scheduler/LimitingImmediateScheduler';
import TaskInterface from '../tools/scheduler/TaskInterface';
import PeriodicScheduler from '../tools/scheduler/PeriodicScheduler';
import SchedulerInterface from '../tools/scheduler/SchedulerInterface';

import ClockProbe from '../tools/ClockProbe';

const enum State {debug, run};
const enum RunMode {limited, unlimited};

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

        const runModeCommands: CommandInterpreter.CommandTableInterface = {
            'set-speed-limited': () => (this._setRunMode(RunMode.limited), 'speed limiting on'),
            'set-speed-unlimited': () => (this._setRunMode(RunMode.unlimited), 'speed limiting off')
        };

        this._commandInterpreter.registerCommands(runModeCommands);
        this._runModeCommandInterpreter.registerCommands(runModeCommands);
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

    interrupt(): void {
        switch (this._state) {
            case State.debug:
                return this._quit();

            case State.run:
                return this._setState(State.debug);

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

        this._board.trap.addHandler(this._onTrap, this);

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
                this._board.getTimer().start(this._getScheduler());
                break;
        }
    }

    protected _setRunMode(runMode: RunMode) {
        if (runMode === this._runMode) {
            return;
        }

        this._runMode = runMode;

        if (this._state === State.run) {
            const timer = this._board.getTimer();

            timer.stop();
            timer.start(this._getScheduler());
        }
    }

    protected _getScheduler(): SchedulerInterface {
        switch (this._runMode) {
            case RunMode.limited:
                return this._limitingScheduler;

            case RunMode.unlimited:
                return this._nonLimitingScheduler;

            default:
                throw new Error('invalid run mode');
        }
    }

    protected _onTrap(trap: BoardInterface.TrapPayload, ctx: this): void {
        if (ctx._state === State.run) {
            ctx._setState(State.debug);
            ctx._outputLine(ctx._debuggerFrontend.describeTrap(trap));
        }
    }

    protected _board: Board;
    protected _cartridge: CartridgeInterface;
    protected _runModeCommandInterpreter: CommandInterpreter;

    protected _limitingScheduler = new LimitedScheduler();
    protected _nonLimitingScheduler = new ImmedateScheduler();
    protected _clockProbe: ClockProbe;

    protected _state = State.debug;
    protected _runMode = RunMode.limited;
}

export default StellaCLI;
