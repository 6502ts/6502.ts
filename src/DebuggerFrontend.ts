/// <reference path="../typings/node/node.d.ts"/>

'use strict';

import Debugger = require('./Debugger');
import hex = require('./hex');
import fs = require('fs');

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
        extraTable?: DebuggerFrontend.CommandTableInterface
    ) {
        this._commandTable = {
            disassemble:    this._disassemble,
            dump:           this._dump,
            load:           this._load,
            hex2dec:        this._hex2dec,
            dec2hex:        this._dec2hex,
            state:          this._state,
            boot:           this._boot,
            stack:          this._stack,
            step:           this._step,
            'break-on':       this._enableBreakpoints,
            'break-off':      this._disableBreakpoints,
            'break':                this._setBreakpoint,
            'break-clear':     this._clearBreakpoint,
            'break-dump':     this._showBreakpoints,
            'break-clear-all':    this._clearAllBreakpoints
        };

        if (typeof(extraTable) !== 'undefined') {
            Object.keys(extraTable).forEach((name: string) =>
                this._commandTable[name] =
                    (args: Array<string>): string => extraTable[name].apply(this, args)
            );
        }
    }

    public execute(cmd: string): string {
        cmd = cmd.replace(/;.*/, '');
        if (cmd.match(/^\s*$/)) return '';

        var components = cmd.split(/\s+/),
            commandName = components.shift();
        
        return this._locateCommand(commandName).call(this, components);
    }

    public getCommands(): Array<string> {
        return Object.keys(this._commandTable);
    }

    private _locateCommand(name: string): DebuggerFrontend.CommandInterface {
        if (this._commandTable[name]) return this._commandTable[name];
        if (this._aliasTable[name]) return this._aliasTable[name];

        var candidates = Object.keys(this._commandTable).filter(
            (candidate: string) => candidate.indexOf(name) === 0
        );
        var nCandidates = candidates.length;

        if (nCandidates > 1) throw new Error('ambiguous command ' + name + ', candidates are ' +
            candidates.join(', ').replace(/, $/, ''));

        if (nCandidates === 0) throw new Error('invalid command ' + name);

        return this._aliasTable[name] = this._commandTable[candidates[0]];
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
        if (args.length !== 2) throw new Error('two arguments expected');

        return this._debugger.dumpAt(
            Math.abs(decodeNumber(args[0])),
            Math.abs(decodeNumber(args[1]))
        );
    }

    private _load(args: Array<string>): string {
        if (args.length < 2) throw new Error('at least two arguments. expected');

        var file = args[0],
            base = Math.abs(decodeNumber(args[1])) % 0x10000,
            buffer = fs.readFileSync(file),
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
        return this._debugger.boot();
    }

    private _step(args: Array<string>): string {
        return this._debugger.step(args.length > 0 ? decodeNumber(args[0]) : 1);
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

    private _commandTable: DebuggerFrontend.CommandTableInterface;
    private _aliasTable: DebuggerFrontend.CommandTableInterface = {};
}

module DebuggerFrontend {
    export interface CommandInterface {
        (args: Array<string>): string;
    }

    export interface CommandTableInterface {
        [command: string]: CommandInterface;
    }
}

export = DebuggerFrontend;
