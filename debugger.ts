/// <reference path="./typings/tsd.d.ts"/>

'use strict';

import readline = require('readline');
import Memory = require('./src/SimpleMemory');
import Debugger = require('./src/Debugger');
import DebuggerFrontend = require('./src/DebuggerFrontend');
import Cpu = require('./src/Cpu');
import fs = require('fs');

var quit = false,
    commands: Array<string>;

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (cmd: string): Array<any> =>
        [commands.filter((candidate: string) => candidate.search(cmd) === 0), cmd]
});

var memory = new Memory(),
    cpu = new Cpu(memory),
    dbg = new Debugger(memory, cpu),
    frontend = new DebuggerFrontend(dbg, {
        quit: (args: Array<string>): string => (quit = true, 'bye')
    });

commands = frontend.getCommands();

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

function tick(): void {
    if (quit) {
        rl.close();
        return;
    }

    rl.question('> ', (cmd: string): void => {
        try {
            var result = frontend.execute(cmd);
            if (result) console.log(result);
        } catch (e) {
            console.log('ERRROR: ' + e.message);
        }

        process.nextTick(tick)
    });
}

tick();
