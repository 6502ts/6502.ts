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
    
function runScripts(): void {
    process.argv.slice(2).forEach((script: string): void => {
        try {
            fs.readFileSync(script)
                .toString('utf8')
                .split('\n')
                .forEach((line: string): void => {
                    var result = frontend.execute(line);
                    if (result) console.log(result);
                });
        } catch(e) {
            console.log('ERROR: ' + e.message);
            process.exit(1);
        }
    });
}

function readCommand(): void {
    rl.question('> ', (cmd: string): void => {
        try {
            var result = frontend.execute(cmd);
            if (result) console.log(result);
        } catch (e) {
            console.log('ERROR: ' + e.message);
        }

        schedule();
    });
}

function executeSlice() {
    if (outputBuffer) {
        process.stdout.write(outputBuffer);
        outputBuffer = '';
    }

    var message = dbg.step(1000);
    if (dbg.executionInterrupted()) {
        console.log(message);
        state = State.debug;
    }
    schedule(10);
}

function schedule(delay: number = 0) {
    switch (state) {
        case State.debug:
            setTimeout(readCommand, delay);
            break;

        case State.run:
            setTimeout(executeSlice, delay);
            break;

        case State.quit:
            rl.close();
            return;
    }
}

var state = State.debug,
    commands: Array<string>,
    outputBuffer = '',
    inputBuffer: Array<number> = ['C'.charCodeAt(0)];

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (cmd: string): Array<any> =>
        [commands.filter((candidate: string) => candidate.search(cmd) === 0), cmd]
});

rl.on('SIGINT', (): void => {
    switch (state) {
        case State.run:
            state = State.debug;
            break;

        case State.debug:
            state = State.quit;
            break;
    }
});

var monitor = new Monitor(),
    cpu = new Cpu(monitor),
    dbg = new Debugger(monitor, cpu),
    frontend = new DebuggerFrontend(dbg, {
        quit: (): string => (state = State.quit, 'bye'),
        run: (): string => {
            state = State.run;
            return 'running, press ctl-c to interrupt...';
        }
    });

monitor.setWriteHandler((value: number): void => {
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
});

monitor.setReadHandler((): number => inputBuffer.length > 0 ? inputBuffer.shift() : 0);

commands = frontend.getCommands();

runScripts();
schedule();
