/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import {Event} from 'microevent.ts';

import BoardInterface from '../board/BoardInterface';
import CpuInterface from '../cpu/CpuInterface';
import Cpu from '../cpu/Cpu';
import Bus from './Bus';
import BusInterface from '../bus/BusInterface';
import Pia from './Pia';
import Tia from './tia/Tia';
import CartridgeInterface from './cartridge/CartridgeInterface';
import Config from './Config';

import VideoOutputInterface from '../io/VideoOutputInterface';
import AudioOutputInterface from '../io/AudioOutputInterface';
import ControlPanel from './ControlPanel';
import ControlPanelInterface from './ControlPanelInterface';
import DigitalJoystickInterface from '../io/DigitalJoystickInterface';
import DigitalJoystick from '../io/DigitalJoystick';
import PaddleInterface from '../io/PaddleInterface';
import Paddle from '../io/Paddle';

import TimerInterface from '../board/TimerInterface';
import SchedulerInterface from '../../tools/scheduler/SchedulerInterface';
import TaskInterface from '../../tools/scheduler/TaskInterface';
import RngInterface from '../../tools/rng/GeneratorInterface';
import {createRng} from '../../tools/rng/factory';

class Board implements BoardInterface {

    constructor(
        private _config: Config,
        cartridge: CartridgeInterface,
        cpuFactory?: (bus: BusInterface, rng?: RngInterface) => CpuInterface
    ) {
        this._rng = createRng(_config.randomSeed < 0 ? Math.random() : _config.randomSeed);
        cartridge.randomize(this._rng);

        const bus = new Bus();

        if (typeof(cpuFactory) === 'undefined') cpuFactory = (bus, rng) => new Cpu(bus, rng);

        const controlPanel = new ControlPanel(),
            joystick0 = new DigitalJoystick(),
            joystick1 = new DigitalJoystick(),
            paddles = new Array(4);

        for (let i = 0; i < 4; i++) {
            paddles[i] = new Paddle();
        }

        const cpu = cpuFactory(bus, this._rng);
        const pia = new Pia(controlPanel, joystick0, joystick1, this._rng);
        const tia = new Tia(_config, joystick0, joystick1, paddles);

        cpu.setInvalidInstructionCallback(() => this._onInvalidInstruction());

        tia
            .setCpu(cpu)
            .setBus(bus);

        cartridge
            .setCpu(cpu)
            .setBus(bus);

        pia.setBus(bus);

        bus
            .setTia(tia)
            .setPia(pia)
            .setCartridge(cartridge);

        this._bus = bus;
        this._cpu = cpu;
        this._tia = tia;
        this._pia = pia;
        this._cartridge = cartridge;
        this._controlPanel = controlPanel;
        this._joystick0 = joystick0;
        this._joystick1 = joystick1;
        this._paddles = paddles;

        this._bus.event.trap.addHandler(
            (payload: Bus.TrapPayload) => this.triggerTrap(BoardInterface.TrapReason.bus, payload.message)
        );

        this._clockMhz = Config.getClockMhz(_config);
        this._sliceSize = 228 * (_config.tvMode === Config.TvMode.ntsc ? 262 : 312);

        this.reset();
    }

    getCpu(): CpuInterface {
        return this._cpu;
    }

    getBus(): BusInterface {
        return this._bus;
    }

    getVideoOutput(): VideoOutputInterface {
        return this._tia;
    }

    getAudioOutput(): Board.Audio {
        return {
            channel0: this._tia.getAudioChannel0(),
            channel1: this._tia.getAudioChannel1()
        };
    }

    getTimer(): TimerInterface {
        return this._timer;
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

        return this;
    }

    boot(): Board {
        let cycles = 0,
            cpuCycles = 0;

        this.reset();

        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot)
            throw new Error("Already booted!");

        while (this._cpu.executionState as CpuInterface.ExecutionState !== CpuInterface.ExecutionState.fetch) {
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

    _updateAudioState(): void {
        this._tia.setAudioEnabled(this._audioEnabled && !this._suspended);
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

    getBoardStateDebug(): string {
        const sep = "============";

        return  'TIA:\n' +
                sep + '\n' +
                this._tia.getDebugState() + '\n' +
                `\n` +
                `PIA:\n` +
                `${sep}\n` +
                `${this._pia.getDebugState()}\n`;
    }

    clock = new Event<number>();

    cpuClock = new Event<number>();

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

    trap = new Event<BoardInterface.TrapPayload>();

    private _cycle(): void {
        this._tia.cycle();

        if (this._subClock++ >= 2) {
            this._pia.cycle();
            this._cpu.cycle();
            this._subClock = 0;
        }
    }

    private _tick(requestedCycles: number): number {
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
            }

            if (lastExecutionState !== this._cpu.executionState) {
                lastExecutionState = this._cpu.executionState;

                if (this._cpu.executionState === CpuInterface.ExecutionState.fetch) {
                    this._cartridge.notifyCpuCycleComplete();

                    if (this._clockMode === BoardInterface.ClockMode.instruction &&
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

    private _start(scheduler: SchedulerInterface) {
        if (this._runTask) return;

        this._runTask = scheduler.start(
            Board._executeSlice,
            this,
            1000 / (this._config.tvMode === Config.TvMode.ntsc ? 60 : 50)
        );
    }

    private static _executeSlice(board: Board, _timeSlice?: number) {
        const slice = _timeSlice ? Math.round(_timeSlice * board._clockMhz * 1000) : board._sliceSize;

        return board._tick(slice) / board._clockMhz  / 1000;
    }

    private _stop() {
        if (!this._runTask) return;

        this._runTask.stop();

        this._runTask = undefined;
    }

    private _onInvalidInstruction() {
        this.triggerTrap(BoardInterface.TrapReason.cpu, 'invalid instruction');
    }

    private _cpu: CpuInterface;
    private _bus: Bus;
    private _tia: Tia;
    private _pia: Pia;
    private _cartridge: CartridgeInterface;
    private _controlPanel: ControlPanel;
    private _joystick0: DigitalJoystick;
    private _joystick1: DigitalJoystick;
    private _paddles: Array<Paddle>;

    private _runTask: TaskInterface;
    private _clockMode = BoardInterface.ClockMode.lazy;
    private _trap = false;

    private _audioEnabled = true;
    private _suspended = true;

    private _subClock = 0;

    private _clockMhz = 0;
    private _sliceSize = 0;

    private _timer = {
        tick: (clocks: number): number => this._tick(clocks),
        start: (scheduler: SchedulerInterface): void => this._start(scheduler),
        stop: (): void => this._stop(),
        isRunning: (): boolean => !!this._runTask
    };

    private _rng: RngInterface;
}

module Board {
    export interface Audio {
        channel0: AudioOutputInterface;
        channel1: AudioOutputInterface;
    }
}

export default Board;
