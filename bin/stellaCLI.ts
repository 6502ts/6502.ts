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

import StellaCLI from '../src/cli/stella/StellaCLI';
import NodeCLIRunner from '../src/cli/NodeCLIRunner';
import NodeFilesystemProvider from '../src/fs/NodeFilesystemProvider';

if (process.argv.length < 3) {
    console.log('usage: stellaCLI.ts cartridge_file [debugger_script]');
    process.exit(1);
}

const cartridgeFile = process.argv[2];

const fsProvider = new NodeFilesystemProvider(),
    cli = new StellaCLI(fsProvider, cartridgeFile),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 3) {
    cli.runDebuggerScript(process.argv[3]);
}
