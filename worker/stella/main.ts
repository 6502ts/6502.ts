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

declare function postMessage(message: any, transfer?: any): void;

import {RpcProvider} from 'worker-rpc';
import EmulationBackend from '../../src/web/stella/service/worker/EmulationBackend';

const rpcProvider = new RpcProvider(
        (message, transfer?) => postMessage(message, transfer)
    ),
    emulationBackend = new EmulationBackend(rpcProvider);

rpcProvider.error.addHandler(e => console.log(e ? e.message : 'unknown rpc error'));

onmessage = messageEvent => rpcProvider.dispatch(messageEvent.data);
emulationBackend.startup();
