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

import EhBasicCLI from '../src/cli/EhBasicCLI';
import NodeCLIRunner from '../src/cli/NodeCLIRunner';
import NodeFilesystemProvider from '../src/fs/NodeFilesystemProvider';
import { ArgumentParser } from 'argparse';
import CpuFactory from '../src/machine/cpu/Factory';

enum CpuTypes {
    stateMachine = 'state-machine',
    batchedAccess = 'batched-access'
}

function cpuType(cliType: CpuTypes): CpuFactory.Type {
    switch (cliType) {
        case CpuTypes.stateMachine:
            return CpuFactory.Type.stateMachine;

        case CpuTypes.batchedAccess:
            return CpuFactory.Type.batchedAccess;

        default:
            throw new Error('invalid CPU type');
    }
}

const parser = new ArgumentParser({
    description: 'CLI interface for the ehBasic hardware monitor',
    addHelp: true
});

parser.addArgument('--cpu-type', {
    help: `one of ${CpuTypes.stateMachine} (default), ${CpuTypes.batchedAccess}`,
    choices: [CpuTypes.stateMachine, CpuTypes.batchedAccess],
    defaultValue: CpuTypes.stateMachine
});
parser.addArgument(['--script', '-s'], { help: 'debugger script' });
parser.addArgument(['--file', '-f'], { help: 'input to feed into the monitor' });

const args = parser.parseArgs();

const fsProvider = new NodeFilesystemProvider(),
    cli = new EhBasicCLI(fsProvider, cpuType(args['cpu_type'])),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (args['script']) {
    cli.runDebuggerScript(args['script']);
}

if (args['file']) {
    cli.readInputFile(args['file']);
}
