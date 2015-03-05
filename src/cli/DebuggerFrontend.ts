/// <reference path="../../typings/node/node.d.ts"/>

'use strict';

import Debugger = require('../machine/Debugger');
import CommandInterpreter = require('./CommandInterpreter');
import hex = require('../tools/hex');
import FileSystemProviderInterface = require('../fs/FilesystemProviderInterface');
import BoardInterface = require('../machine/board/BoardInterface');
import util = require('util');

function decodeNumber(value: string): number {
    try {
        return hex.decode(value);
    } catch (e) {
        if (!value.match(/^-?\d+$/)) 
            throw new TypeError('number expected, got ' + value);
        
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
            disassemble:    this._disassemble.bind(this),
            dump:           this._dump.bind(this),
            load:           this._load.bind(this),
            hex2dec:        this._hex2dec.bind(this),
            dec2hex:        this._dec2hex.bind(this),
            state:          this._state.bind(this),
            boot:           this._boot.bind(this),
            stack:          this._stack.bind(this),
            step:           this._step.bind(this),
            'break-on':       this._enableBreakpoints.bind(this),
            'break-off':      this._disableBreakpoints.bind(this),
            'break':                this._setBreakpoint.bind(this),
            'break-clear':     this._clearBreakpoint.bind(this),
            'break-dump':     this._showBreakpoints.bind(this),
            'break-clear-all':    this._clearAllBreakpoints.bind(this),
            'trace-on':     this._enableTrace.bind(this),
            'trace-off':    this._disableTrace.bind(this),
            'trace':        this._trace.bind(this)
        });
    }

    private _disassemble(args: Array<string>): string {
        var address: number,
            size: number;

        switch (args.length) {
            case 0:
                return this._debugger.disassemble(1);

            case 1:
                return this._debugger.disassemble(decodeNumber(args[0]));

            default:
                return this._debugger.disassembleAt(
                    decodeNumber(args[0]), decodeNumber(args[1]));
        }

        return this._debugger.disassembleAt(address, size);
    }

    private _dump(args: Array<string>): string {
        if (args.length < 1) throw new Error('at least one argument expected');

        return this._debugger.dumpAt(
            Math.abs(decodeNumber(args[0])),
            Math.abs(args.length > 1 ? decodeNumber(args[1]) : 1)
        );
    }

    private _load(args: Array<string>): string {
        if (args.length < 2) throw new Error('at least two arguments. expected');

        var file = args[0],
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
        var cycles = 0,
            board = this._debugger.getBoard();

        var clockHandler = () => cycles++;

        board.cpuClock.addHandler(clockHandler);

        try {
            this._debugger.getBoard().boot();
        } catch (e) {
            var exception = e || new Error('unknown exception during boot');
        }

        board.cpuClock.removeHandler(clockHandler);

        if (exception) throw (exception);

        return util.format('Boot successful in %s cycles', cycles);
    }

    private _step(args: Array<string>): string {
        var timestamp = Date.now(),
            instructionCount = args.length > 0 ? decodeNumber(args[0]) : 1,
            board = this._debugger.getBoard(),
            cycles = 0,
            result: string,
            trap = false,
            trapReason: BoardInterface.TrapReason;

        var clockHandler = () => cycles++,
            trapHandler = (payload: BoardInterface.TrapPayload) => {
                trap = true;
                trapReason = payload.reason;
            };

        board.cpuClock.addHandler(clockHandler);
        board.trap.addHandler(trapHandler);

        try {
            board.getTimer().step(instructionCount);
        } catch (e) {
            var exception = e || new Error('unknown exception during stepping');
        }

        board.cpuClock.removeHandler(clockHandler);
        board.trap.removeHandler(trapHandler);

        if (exception) throw exception;

        result = util.format('Used %s cycles in %s milliseconds, now at\n%s',
            cycles,
            Date.now() - timestamp,
            this._debugger.disassemble(1)
        );

        if (trap) {
            switch (trapReason) {
                case BoardInterface.TrapReason.cpu:
                    result = 'INVALID INSTRUCTION!\n' + result;
                    break;

                case BoardInterface.TrapReason.debug:
                    result = 'BREAKPOINT\n' + result;
                    break;

                default:
                    result = 'UNKNOWN TRAP\n' + result;
                    break;
            }
        }

        return result;
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
        if (args.length < 1) throw new Error('at least one argument expected');

        var name = args.length > 1 ? args[1] : '-',
            address = decodeNumber(args[0]);

        this._debugger.setBreakpoint(address, name);

        return 'Breakpoint "' + name + '" at ' + hex.encode(address, 4);
    }

    private _clearBreakpoint(args: Array<string>): string {
        if (args.length < 1) throw new Error('argument expected');

        var address = decodeNumber(args[0]);

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
        return this._debugger.trace(args.length > 0 ? decodeNumber(args[0]): 10);
    }
}

export = DebuggerFrontend;
