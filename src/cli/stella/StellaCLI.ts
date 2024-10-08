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

import FilesystemProviderInterface from '../../fs/FilesystemProviderInterface';
import DebuggerCLI from '../DebuggerCLI';
import AbstractCLI from '../AbstractCLI';

import BoardInterface from '../../machine/board/BoardInterface';
import Board from '../../machine/stella/Board';
import StellaConfig from '../../machine/stella/Config';

import CartridgeInterface from '../../machine/stella/cartridge/CartridgeInterface';
import CartridgeFactory from '../../machine/stella/cartridge/CartridgeFactory';

import CommandInterpreter from '../CommandInterpreter';
import ImmedateScheduler from '../../tools/scheduler/ImmedateScheduler';
import ConstantTimesliceScheduler from '../../tools/scheduler/limiting/ConstantTimeslice';
import ConstantCyclesScheduler from '../../tools/scheduler/limiting/ConstantCycles';
import PeriodicScheduler from '../../tools/scheduler/PeriodicScheduler';
import SchedulerInterface from '../../tools/scheduler/SchedulerInterface';
import ClockProbe from '../../tools/ClockProbe';

import SystemConfigSetupProvider from './SystemConfigSetupProvider';
import ControlPanelManagementProvider from './ControlPanelManagementProvider';
import { describeCartridgeType } from '../../machine/stella/cartridge/CartridgeInfo';

const enum RunMode {
    limited,
    unlimited,
}

const CLOCK_PROBE_INTERVAL = 1000;

class StellaCLI extends DebuggerCLI {
    constructor(fsProvider: FilesystemProviderInterface, protected _cartridgeFile?: string) {
        super(fsProvider);

        this.events.stateChanged = new Event<StellaCLI.State>();

        const systemConfigSetupProvider = new SystemConfigSetupProvider(this._stellaConfig);

        this._commandInterpreter.registerCommands({
            run: () => (this._setState(StellaCLI.State.run), 'running...'),
        });

        this._runModeCommandInterpreter = new CommandInterpreter({
            stop: () => (this._setState(StellaCLI.State.debug), 'stopped, entered debugger'),
        });

        this._setupModeCommandInterpreter = new CommandInterpreter({
            'load-cartridge': this._executeLoadCartridge.bind(this),
        });
        this._setupModeCommandInterpreter.registerCommands(systemConfigSetupProvider.getCommands());

        const runModeCommands: CommandInterpreter.CommandTableInterface = {
            'set-speed-limited': () => (this._setRunMode(RunMode.limited), 'speed limiting on'),
            'set-speed-unlimited': () => (this._setRunMode(RunMode.unlimited), 'speed limiting off'),
        };

        this._commandInterpreter.registerCommands(runModeCommands);
        this._runModeCommandInterpreter.registerCommands(runModeCommands);
    }

    getPrompt(): string {
        const frequency = this._clockProbe ? this._clockProbe.getFrequency() : 0,
            prefix = frequency > 0 ? `${(frequency / 1000000).toFixed(2)} MHz ` : '';

        switch (this._state) {
            case StellaCLI.State.setup:
                return `[setup] > `;

            case StellaCLI.State.debug:
                return `${prefix}[debug] > `;

            case StellaCLI.State.run:
                return `${prefix}[run] > `;

            default:
                throw new Error('invalid run state');
        }
    }

    interrupt(): void {
        switch (this._state) {
            case StellaCLI.State.debug:
                return this._quit();

            case StellaCLI.State.run:
                return this._setState(StellaCLI.State.debug);
        }
    }

    getBoard(): Board {
        return this._board;
    }

    getState(): StellaCLI.State {
        return this._state;
    }

    async loadCartridgeFromBuffer(buffer: { [idx: number]: number; length: number }, name: string): Promise<void> {
        const factory = new CartridgeFactory();

        try {
            this._cartridge = await factory.createCartridge(buffer);
            this._initializeHardware();
            this._setState(StellaCLI.State.debug);
            this._cartridgeFile = name;

            this._outputLine(`successfully loaded ${name}`);
            this._outputLine(`format: ${describeCartridgeType(this._cartridge.getType())}`);
        } catch (e) {
            this._outputLine(e.message);
        }
    }

    protected _getCommandInterpreter(): CommandInterpreter {
        switch (this._state) {
            case StellaCLI.State.setup:
                return this._setupModeCommandInterpreter;

            case StellaCLI.State.debug:
                return super._getCommandInterpreter();

            case StellaCLI.State.run:
                return this._runModeCommandInterpreter;

            default:
                throw new Error('invalid run state');
        }
    }

    protected async _executeLoadCartridge(args: Array<string>): Promise<string> {
        if (args.length === 0) {
            return 'ERROR: filename required';
        }

        const file = args[0];

        try {
            await this._loadCartridge(file);
            this._cartridgeFile = file;
            this._initializeHardware();
            this._setState(StellaCLI.State.debug);
        } catch (e) {
            return e.message;
        }

        return `succesfully loaded ${file}\nformat: ${describeCartridgeType(this._cartridge.getType())}`;
    }

    protected async _loadCartridge(file: string): Promise<void> {
        const fileBuffer = this._fsProvider.readBinaryFileSync(file),
            factory = new CartridgeFactory();

        this._cartridge = await factory.createCartridge(fileBuffer);
    }

    protected _initialize(): void {
        if (this._cartridgeFile) {
            try {
                this._loadCartridge(this._cartridgeFile);
                this._initializeHardware();
                this._setState(StellaCLI.State.debug);
            } catch (e) {
                this._outputLine(e.message);
            }
        }

        this._prompt();
    }

    protected _initializeHardware(): void {
        const board = new Board(this._stellaConfig, this._cartridge);

        this._board = board;

        const clockProbe = new ClockProbe(new PeriodicScheduler(CLOCK_PROBE_INTERVAL));
        clockProbe.attach(this._board.clock);
        clockProbe.frequencyUpdate.addHandler(() => this.events.promptChanged.dispatch(undefined));

        this._debugger.attach(this._board);
        this._board.trap.addHandler(this._onTrap, this);

        this._clockProbe = clockProbe;

        const controlPanel = this._board.getControlPanel(),
            controlPanelManagementProvider = new ControlPanelManagementProvider(controlPanel);

        this._commandInterpreter.registerCommands(controlPanelManagementProvider.getCommands());
        this._runModeCommandInterpreter.registerCommands(controlPanelManagementProvider.getCommands());

        controlPanel.getDifficultySwitchP0().toggle(true);
        controlPanel.getDifficultySwitchP0().toggle(true);

        this._limitingScheduler = this._stellaConfig.pcmAudio
            ? new ConstantTimesliceScheduler()
            : new ConstantCyclesScheduler();

        this.hardwareInitialized.dispatch(undefined);
    }

    protected _setState(state: StellaCLI.State) {
        if (state === this._state) {
            return;
        }

        this._state = state;
        this.events.availableCommandsChanged.dispatch(undefined);
        this.events.promptChanged.dispatch(undefined);

        switch (state) {
            case StellaCLI.State.debug:
                this._board.suspend();
                this._clockProbe.stop();
                this._board.getTimer().stop();
                break;

            case StellaCLI.State.run:
                this._board.resume();
                this._clockProbe.start();
                this._board.getTimer().start(this._getScheduler());
                break;
        }

        this.events.stateChanged.dispatch(state);
    }

    protected _setRunMode(runMode: RunMode) {
        if (runMode === this._runMode) {
            return;
        }

        this._runMode = runMode;

        if (this._state === StellaCLI.State.run) {
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
        if (ctx._state === StellaCLI.State.run) {
            ctx._setState(StellaCLI.State.debug);
            ctx._outputLine(ctx._debuggerFrontend.describeTrap(trap));
        }
    }

    hardwareInitialized = new Event<void>();
    events: Events;

    protected _stellaConfig = StellaConfig.create();
    protected _board: Board;
    protected _cartridge: CartridgeInterface;
    protected _runModeCommandInterpreter: CommandInterpreter;
    protected _setupModeCommandInterpreter: CommandInterpreter;

    protected _limitingScheduler: SchedulerInterface = null;
    protected _nonLimitingScheduler = new ImmedateScheduler();
    protected _clockProbe: ClockProbe;

    protected _state = StellaCLI.State.setup;
    protected _runMode = RunMode.limited;
}

interface Events extends AbstractCLI.Events {
    stateChanged: Event<StellaCLI.State>;
}

namespace StellaCLI {
    export const enum State {
        setup,
        debug,
        run,
    }
}

export { StellaCLI as default };
