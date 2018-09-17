/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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
