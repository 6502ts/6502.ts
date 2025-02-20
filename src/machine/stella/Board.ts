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

import BoardInterface from '../board/BoardInterface';
import CpuInterface from '../cpu/CpuInterface';
import Bus from './Bus';
import BusInterface from '../bus/BusInterface';
import Pia from './Pia';
import Tia from './tia/Tia';
import CartridgeInterface from './cartridge/CartridgeInterface';
import Config from './Config';

import VideoOutputInterface from '../io/VideoOutputInterface';
import WaveformAudioOutputInterface from '../io/WaveformAudioOutputInterface';
import PCMAudioOutputInterface from '../io/PCMAudioOutputInterface';
import ControlPanel from './ControlPanel';
import ControlPanelInterface from './ControlPanelInterface';
import DigitalJoystickInterface from '../io/DigitalJoystickInterface';
import DigitalJoystick from '../io/DigitalJoystick';
import KeypadControllerInterface from '../io/KeypadControllerInterface';
import KeypadController from '../io/KeypadController';
import KeypadsReader from './KeypadsReader';
import PaddleInterface from '../io/PaddleInterface';
import Paddle from '../io/Paddle';

import TimerInterface from '../board/TimerInterface';
import SchedulerInterface from '../../tools/scheduler/SchedulerInterface';
import TaskInterface from '../../tools/scheduler/TaskInterface';
import RngInterface from '../../tools/rng/GeneratorInterface';
import { createRng } from '../../tools/rng/factory';
import CpuFactory from '../cpu/Factory';

class Board implements BoardInterface {
    constructor(
        private _config: Config,
        cartridge: CartridgeInterface,
        cpuFactory?: (bus: BusInterface, rng?: RngInterface) => CpuInterface
    ) {
        this._rng = createRng(_config.randomSeed < 0 ? Math.random() : _config.randomSeed);
        cartridge.randomize(this._rng);

        const bus = new Bus();

        if (typeof cpuFactory === 'undefined') {
            cpuFactory = (_bus, rng) => new CpuFactory(_config.cpuType).create(_bus, rng);
        }

        const controlPanel = new ControlPanel(),
            joystick0 = new DigitalJoystick(),
            joystick1 = new DigitalJoystick(),
            paddles = new Array(4),
            keypadControllers = new Array(2);

        for (let i = 0; i < 4; i++) {
            paddles[i] = new Paddle();
        }

        for (let i = 0; i < 2; i++) {
            keypadControllers[i] = new KeypadController();
        }

        const keypads = new KeypadsReader(keypadControllers);

        const cpu = cpuFactory(bus, this._rng);
        const pia = new Pia(_config, controlPanel, joystick0, joystick1, paddles, keypads, this._rng);
        const tia = new Tia(_config, joystick0, joystick1, paddles, keypads);

        cpu.setInvalidInstructionCallback(() => this._onInvalidInstruction());

        keypads.setCpuTimeProvider(() => this.getCpuTime());

        tia.setCpu(cpu)
            .setBus(bus)
            .setCpuTimeProvider(() => this.getCpuTime());

        cartridge
            .setCpu(cpu)
            .setBus(bus)
            .setCpuTimeProvider(() => this.getCpuTime())
            .setRng(this._rng);

        pia.setBus(bus);

        bus.setTia(tia).setPia(pia).setCartridge(cartridge);

        this._bus = bus;
        this._cpu = cpu;
        this._tia = tia;
        this._pia = pia;
        this._cartridge = cartridge;
        this._controlPanel = controlPanel;
        this._joystick0 = joystick0;
        this._joystick1 = joystick1;
        this._paddles = paddles;
        this._keypad0 = keypadControllers[0];
        this._keypad1 = keypadControllers[1];

        this._bus.event.trap.addHandler((payload: Bus.TrapPayload) =>
            this.triggerTrap(BoardInterface.TrapReason.bus, payload.message)
        );

        this._clockHz = Config.getClockHz(_config);
        this._sliceSize = 228 * (_config.tvMode === Config.TvMode.ntsc ? 262 : 312);

        this.reset();
    }

    getCpu(): CpuInterface {
        return this._cpu;
    }

    getBus(): Bus {
        return this._bus;
    }

    getVideoOutput(): VideoOutputInterface {
        return this._tia;
    }

    getWaveformChannels(): Array<WaveformAudioOutputInterface> {
        return [0, 1].map((i) => this._tia.getWaveformChannel(i));
    }

    getPCMChannel(): PCMAudioOutputInterface {
        return this._tia.getPCMChannel();
    }

    getTimer(): TimerInterface {
        return this._timer;
    }

    getConfig(): Config {
        return this._config;
    }

    reset(): Board {
        this._cpu.reset();
        this._tia.reset();
        this._pia.reset();
        this._cartridge.reset();

        this._controlPanel.getResetButton().toggle(false);
        this._controlPanel.getSelectSwitch().toggle(false);
        this._controlPanel.getColorSwitch().toggle(false);
        this._controlPanel.getDifficultySwitchP0().toggle(true);
        this._controlPanel.getDifficultySwitchP1().toggle(true);

        this._subClock = 0;
        this._cpuCycles = 0;

        this.systemReset.dispatch();

        return this;
    }

    boot(): Board {
        let cycles = 0,
            cpuCycles = 0;

        this.reset();

        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot) {
            throw new Error('Already booted!');
        }

        while ((this._cpu.executionState as CpuInterface.ExecutionState) !== CpuInterface.ExecutionState.fetch) {
            this._cycle();

            cycles++;
            if (this._subClock === 0) {
                cpuCycles++;
            }
        }

        this.cpuClock.dispatch(cpuCycles);
        this.clock.dispatch(cycles);
        return this;
    }

    suspend(): void {
        this._suspended = true;
        this._updateAudioState();
    }

    resume(): void {
        this._suspended = false;
        this._updateAudioState();
    }

    setAudioEnabled(state: boolean) {
        this._audioEnabled = state;
        this._updateAudioState();
    }

    triggerTrap(reason: BoardInterface.TrapReason, message?: string): Board {
        this._stop();

        this._trap = true;

        if (this.trap.hasHandlers) {
            this.trap.dispatch(new BoardInterface.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }

        return this;
    }

    getControlPanel(): ControlPanelInterface {
        return this._controlPanel;
    }

    getJoystick0(): DigitalJoystickInterface {
        return this._joystick0;
    }

    getJoystick1(): DigitalJoystickInterface {
        return this._joystick1;
    }

    getKeypad0(): KeypadControllerInterface {
        return this._keypad0;
    }

    getKeypad1(): KeypadControllerInterface {
        return this._keypad1;
    }

    getBoardStateDebug(): string {
        const sep = '============';

        return (
            'TIA:\n' +
            sep +
            '\n' +
            this._tia.getDebugState() +
            '\n' +
            `\n` +
            `PIA:\n` +
            `${sep}\n` +
            `${this._pia.getDebugState()}\n`
        );
    }

    setClockMode(clockMode: BoardInterface.ClockMode): Board {
        this._clockMode = clockMode;

        return this;
    }

    getClockMode(): BoardInterface.ClockMode {
        return this._clockMode;
    }

    getPaddle(idx: number): PaddleInterface {
        return this._paddles[idx];
    }

    getCpuTime(): number {
        return (this._cpuCycles / Config.getClockHz(this._config)) * 3;
    }

    tick(requestedCycles: number): number {
        let i = 0,
            cycles = 0,
            cpuCycles = 0,
            lastExecutionState = this._cpu.executionState;

        this._trap = false;

        while (i++ < requestedCycles && !this._trap) {
            this._cycle();
            cycles++;

            if (this._subClock === 0) {
                cpuCycles++;
                this._cpuCycles++;
            }

            if (lastExecutionState !== this._cpu.executionState) {
                lastExecutionState = this._cpu.executionState;

                if (this._cpu.executionState === CpuInterface.ExecutionState.fetch) {
                    this._cartridge.notifyCpuCycleComplete();

                    if (
                        this._clockMode === BoardInterface.ClockMode.instruction &&
                        cpuCycles > 0 &&
                        this.cpuClock.hasHandlers
                    ) {
                        this.cpuClock.dispatch(cpuCycles);
                        cpuCycles = 0;
                    }
                }
            }
        }

        if (cpuCycles > 0 && this.cpuClock.hasHandlers) {
            this.cpuClock.dispatch(cpuCycles);
        }

        if (cycles > 0 && this.clock.hasHandlers) {
            this.clock.dispatch(cycles);
        }

        return cycles;
    }

    getSubclock(): number {
        return this._subClock;
    }

    private static _executeSlice(board: Board, _timeSlice?: number) {
        const slice = _timeSlice ? Math.round((_timeSlice * board._clockHz) / 1000) : board._sliceSize;

        return (board.tick(slice) / board._clockHz) * 1000;
    }

    private _updateAudioState(): void {
        this._tia.setAudioEnabled(this._audioEnabled && !this._suspended);
    }

    private _cycle(): void {
        this._tia.cycle();

        if (this._subClock++ >= 2) {
            this._pia.cycle();
            this._cpu.cycle();
            this._subClock = 0;
        }
    }

    private _start(scheduler: SchedulerInterface) {
        if (this._runTask) {
            return;
        }

        this._runTask = scheduler.start(
            Board._executeSlice,
            this,
            1000 / (this._config.tvMode === Config.TvMode.ntsc ? 60 : 50)
        );
    }

    private _stop() {
        if (!this._runTask) {
            return;
        }

        this._runTask.stop();

        this._runTask = undefined;
    }

    private _onInvalidInstruction() {
        this.triggerTrap(BoardInterface.TrapReason.cpu, 'invalid instruction');
    }

    trap = new Event<BoardInterface.TrapPayload>();

    clock = new Event<number>();

    cpuClock = new Event<number>();

    systemReset = new Event<void>();

    private _cpu: CpuInterface;
    private _bus: Bus;
    private _tia: Tia;
    private _pia: Pia;
    private _cartridge: CartridgeInterface;
    private _controlPanel: ControlPanel;
    private _joystick0: DigitalJoystick;
    private _joystick1: DigitalJoystick;
    private _keypad0: KeypadController;
    private _keypad1: KeypadController;
    private _paddles: Array<Paddle>;

    private _runTask: TaskInterface;
    private _clockMode = BoardInterface.ClockMode.lazy;
    private _cpuCycles = 0;
    private _trap = false;

    private _audioEnabled = true;
    private _suspended = true;

    private _subClock = 0;

    private _clockHz = 0;
    private _sliceSize = 0;

    private _timer = {
        tick: (clocks: number): number => this.tick(clocks),
        start: (scheduler: SchedulerInterface): void => this._start(scheduler),
        stop: (): void => this._stop(),
        isRunning: (): boolean => !!this._runTask,
    };

    private _rng: RngInterface;
}

export { Board as default };
