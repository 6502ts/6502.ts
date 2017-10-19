/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

import Debugger from '../machine/Debugger';
import CommandInterpreter from './CommandInterpreter';
import FileSystemProviderInterface from '../fs/FilesystemProviderInterface';
import BoardInterface from '../machine/board/BoardInterface';

import * as hex from '../tools/hex';
import * as util from 'util';

function decodeNumber(value: string): number {
    try {
        return hex.decode(value);
    } catch (e) {
        if (!value.match(/^-?\d+$/)) {
            throw new TypeError('number expected, got ' + value);
        }

        return Number(value);
    }
}

class DebuggerFrontend {
    constructor(
        private _debugger: Debugger,
        private _fileSystemProvider: FileSystemProviderInterface,
        private _commandInterpreter: CommandInterpreter
    ) {
        this._commandInterpreter.registerCommands({
            disassemble: this._disassemble.bind(this),
            dump: this._dump.bind(this),
            load: this._load.bind(this),
            hex2dec: this._hex2dec.bind(this),
            dec2hex: this._dec2hex.bind(this),
            state: this._state.bind(this),
            boot: this._boot.bind(this),
            stack: this._stack.bind(this),
            step: this._step.bind(this),
            'step-clock': this._stepClock.bind(this),
            reset: () => this._reset(false),
            'reset-hard': () => this._reset(true),
            'break-on': this._enableBreakpoints.bind(this),
            'break-off': this._disableBreakpoints.bind(this),
            break: this._setBreakpoint.bind(this),
            'break-clear': this._clearBreakpoint.bind(this),
            'break-dump': this._showBreakpoints.bind(this),
            'break-clear-all': this._clearAllBreakpoints.bind(this),
            'trace-on': this._enableTrace.bind(this),
            'trace-off': this._disableTrace.bind(this),
            trace: this._trace.bind(this)
        });
    }

    describeTrap(trap?: BoardInterface.TrapPayload): string {
        if (typeof trap === 'undefined') {
            trap = this._debugger.getLastTrap();
        }

        if (!trap) {
            return '';
        }

        const message = trap.message ? trap.message : 'unknown';

        switch (trap.reason) {
            case BoardInterface.TrapReason.cpu:
                return util.format('CPU TRAP: %s', message);

            case BoardInterface.TrapReason.debug:
                return util.format('DEBUGGER TRAP: %s', message);

            default:
                return util.format('UNKNOWN TRAP: %s', message);
        }
    }

    private _disassemble(args: Array<string>): string {
        switch (args.length) {
            case 0:
                return this._debugger.disassemble(1);

            case 1:
                return this._debugger.disassemble(decodeNumber(args[0]));

            default:
                return this._debugger.disassembleAt(decodeNumber(args[0]), decodeNumber(args[1]));
        }
    }

    private _dump(args: Array<string>): string {
        if (args.length < 1) {
            throw new Error('at least one argument expected');
        }

        return this._debugger.dumpAt(
            Math.abs(decodeNumber(args[0])),
            Math.abs(args.length > 1 ? decodeNumber(args[1]) : 1)
        );
    }

    private _load(args: Array<string>): string {
        if (args.length < 2) {
            throw new Error('at least two arguments. expected');
        }

        const file = args[0],
            base = Math.abs(decodeNumber(args[1])) % 0x10000,
            buffer = this._fileSystemProvider.readBinaryFileSync(file),
            offset = args.length > 2 ? Math.min(Math.abs(decodeNumber(args[2])), buffer.length - 1) : 0,
            count = args.length > 3 ? Math.min(Math.abs(decodeNumber(args[3])), buffer.length) : buffer.length;

        this._debugger.loadBlock(buffer, base, offset, offset + count - 1);

        return 'successfully loaded ' + count + ' bytes at ' + hex.encode(base, 4);
    }

    private _hex2dec(args: Array<string>): string {
        return args.map((value: string) => hex.decode(value)).join(' ');
    }

    private _dec2hex(args: Array<string>): string {
        return args.map((value: string) => String(hex.encode(Number(value)))).join(' ');
    }

    private _state(): string {
        return this._debugger.dumpState();
    }

    private _boot(): string {
        const board = this._debugger.getBoard();
        let cycles = 0;

        const clockHandler = (clock: number) => (cycles += clock);

        board.cpuClock.addHandler(clockHandler);

        let exception: Error;
        try {
            this._debugger.getBoard().boot();
        } catch (e) {
            exception = e || new Error('unknown exception during boot');
        }

        board.cpuClock.removeHandler(clockHandler);

        if (exception) {
            throw exception;
        }

        return util.format('Boot successful in %s cycles', cycles);
    }

    private _reset(hard: boolean): string {
        this._debugger.getBoard().reset(hard);

        return 'reset successful';
    }

    private _step(args: Array<string>): string {
        const timestamp = Date.now(),
            instructionCount = args.length > 0 ? decodeNumber(args[0]) : 1,
            { cycles, cpuCycles } = this._debugger.step(instructionCount),
            trap = this._debugger.getLastTrap();

        return util.format(
            'Used %s cycles (CPU: %s) in %s milliseconds, now at\n%s\n%s\n',
            cycles,
            cpuCycles,
            Date.now() - timestamp,
            this._debugger.disassemble(1),
            this.describeTrap(trap)
        );
    }

    private _stack(): string {
        return this._debugger.dumpStack();
    }

    private _enableBreakpoints(): string {
        this._debugger.setBreakpointsEnabled(true);
        return 'Breakpoints enabled';
    }

    private _disableBreakpoints(): string {
        this._debugger.setBreakpointsEnabled(false);
        return 'Breakpoints disabled';
    }

    private _setBreakpoint(args: Array<string>): string {
        if (args.length < 1) {
            throw new Error('at least one argument expected');
        }

        const name = args.length > 1 ? args[1] : '-',
            address = decodeNumber(args[0]);

        this._debugger.setBreakpoint(address, name);

        return 'Breakpoint "' + name + '" at ' + hex.encode(address, 4);
    }

    private _clearBreakpoint(args: Array<string>): string {
        if (args.length < 1) {
            throw new Error('argument expected');
        }

        const address = decodeNumber(args[0]);

        this._debugger.clearBreakpoint(address);

        return 'Cleared breakpoint at ' + hex.encode(address, 4);
    }

    private _showBreakpoints(): string {
        return this._debugger.dumpBreakpoints();
    }

    private _clearAllBreakpoints(): string {
        this._debugger.clearAllBreakpoints();

        return 'All breakpoints cleared';
    }

    private _enableTrace(): string {
        this._debugger.setTraceEnabled(true);

        return 'Tracing enabled';
    }

    private _disableTrace(): string {
        this._debugger.setTraceEnabled(false);

        return 'Tracing disabled';
    }

    private _trace(args: Array<string>): string {
        return this._debugger.trace(args.length > 0 ? decodeNumber(args[0]) : 10);
    }

    private _stepClock(args: Array<string>): string {
        const requestedCycles = args.length > 0 ? decodeNumber(args[0]) : 1,
            timestamp = Date.now();

        const cycles = this._debugger.stepClock(requestedCycles);

        const time = Date.now() - timestamp,
            trap = this._debugger.getLastTrap();

        return (
            `clock stepped ${cycles} cycles in ${time} msec; ` +
            `now at ${this._debugger.disassemble(1)}\n${trap ? this.describeTrap(trap) : ''}`
        );
    }
}

export default DebuggerFrontend;
