/// <reference path="./typings/node/node.d.ts"/>

'use strict';

import readline = require('readline');
import Monitor = require('./src/EhBasicMonitor');
import Debugger = require('./src/Debugger');
import DebuggerFrontend = require('./src/DebuggerFrontend');
import Cpu = require('./src/Cpu');
import fs = require('fs');

enum State {
    debug, run, quit
}

var SAMPLE_SIZE = 20000000;

var state: State,
    commands: Array<string>,
    outputBuffer = '',
    inputBuffer: Array<number> = [],
    promptForInput = true,
    lastSpeedSample: number,
    cyclesProcessed: number,
    speed: number;

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (cmd: string): Array<any> =>
        [commands.filter((candidate: string) => candidate.search(cmd) === 0), cmd]
});

var monitor = new Monitor(),
    cpu = new Cpu(monitor),
    dbg = new Debugger(monitor, cpu),
    frontend = new DebuggerFrontend(dbg, {
        quit: (): string => {
            setState(State.quit);
            return 'bye';
        },
        run: (): string => {
            setState(State.run);
            return 'running, press ctl-c to interrupt...';
        },
        input: (args: Array<string>, cmd: string): string => {
            var data = cmd.replace(/^\s*input\s*/, '').replace(/\\n/, '\n'),
                length = data.length;

            for (var i = 0; i < length; i++)
                inputBuffer.push(data[i] === '\n' ? 0x0D : data.charCodeAt(i) & 0xFF);
            return '';
        }
    });


rl.on('SIGINT', onSigint);
rl.on('line', onLine);

monitor
    .setWriteHandler(monitorWriteHandler)
    .setReadHandler(readHandler);

commands = frontend.getCommands();

setState(State.debug);
if (process.argv.length > 2) runDebuggerScript(process.argv[2]);
if (process.argv.length > 3) readBasicProgram(process.argv[3]);
schedule();

function setState(newState: State): void {
    state = newState;

    switch (state) {
        case State.run:
            cyclesProcessed = 0;
            break;
    }

    configurePrompt();
}

function configurePrompt() {
    var prompt = speed ? (speed.toFixed(2) + ' MHz ') : '';

    switch (state) {
        case State.run:
            prompt += '[run] # ';
            lastSpeedSample = Date.now();
            rl.setPrompt(prompt, prompt.length);
            break;

        case State.debug:
            prompt += '[dbg] # ';
            rl.setPrompt(prompt, prompt.length);
            break;
    }
}

function runDebuggerScript(filename: string): void {
    fs.readFileSync(filename)
        .toString('utf8')
        .split('\n')
        .forEach((line: string): void => {
            var result = frontend.execute(line);
            if (result) console.log(result);
        });
}

function readBasicProgram(filename: string): void {
    fs.readFileSync(filename)
        .toString('utf8')
        .split('\n')
        .forEach((line: string): void => {
            var length = line.length;
            for (var i = 0; i < length; i++) inputBuffer.push(line.charCodeAt(i) & 0xFF);
            inputBuffer.push(0x0D);
        });
}

function executeSlice() {
    if (outputBuffer) {
        process.stdout.write(outputBuffer);
        outputBuffer = '';
    }

    var cycles = dbg.step(100000);
    if (dbg.executionInterrupted()) {
        switch (dbg.getExecutionState()) {
            case Debugger.ExecutionState.breakpoint:
                console.log('BREAKPOINT');
                break;

            case Debugger.ExecutionState.invalidInstruction:
                console.log('INVALID INSTRUCTION');
                break;
        }
        setState(State.debug);
    }

    processSpeedSample(cycles);
    schedule();
}

function processSpeedSample(cycles: number): void {
    cyclesProcessed += cycles;

    if (cyclesProcessed > SAMPLE_SIZE) {
        var timestamp = Date.now();
        speed = cyclesProcessed / (timestamp - lastSpeedSample) / 1000;
        cyclesProcessed = 0;
        lastSpeedSample = timestamp;
        configurePrompt();
    }
}

function schedule() {
    switch (state) {
        case State.debug:
            rl.prompt();
            break;

        case State.run:
            setImmediate(executeSlice);
            break;

        case State.quit:
            rl.close();
            return;
    }
}

function onSigint(): void {
    switch (state) {
        case State.run:
            setState(State.debug);
            break;

        case State.debug:
            setState(State.quit);
            break;
    }

    schedule();
}

function onLine(data: string): void {
    switch (state) {
        case State.run:
            var size = data.length;

            for (var i = 0; i < size; i++) {
                inputBuffer.push(data.charCodeAt(i) & 0xFF);
            }
            inputBuffer.push(0x0D);
            break;

        case State.debug:
            try {
                console.log(frontend.execute(data));
            } catch (e) {
                console.log('ERROR: ' + e.message);
            }
            schedule();
            break;
    }
}

function monitorWriteHandler(value: number): void {
    switch (state) {
        case State.debug:
            outputBuffer += String.fromCharCode(value);
            console.log('output event, buffer now');
            console.log(outputBuffer);
            console.log('');
            break;

        case State.run:
            process.stdout.write(String.fromCharCode(value));
            break;
    }
}

function readHandler(): number {
    if (inputBuffer.length > 0) {
        promptForInput = true;
        return inputBuffer.shift();
    }

    if (state === State.run && promptForInput) {
        promptForInput = false;
        setImmediate(function(): void
            {
                console.log();
                rl.prompt();
            }
        );
    }
    return 0;
}
