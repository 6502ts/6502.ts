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

declare function postMessage(message: any, transfer?: any): void;

import { RpcProviderInterface, RpcProvider } from 'worker-rpc';

let rpcProvider: RpcProvider = null,
    port: MessagePort = null,
    portPending: MessagePort = null;

function send(message: any, transfer?: any): void {
    if (port) {
        port.postMessage(message, transfer);
    } else {
        postMessage(message, transfer);
    }

    if (portPending) {
        port = portPending;
        port.onmessage = (e: MessageEvent) => rpcProvider.dispatch(e.data);
    }

    portPending = null;
}

rpcProvider = new RpcProvider(send);
rpcProvider.error.addHandler(e => {
    console.log(e ? e.message : 'unknown rpc error');
});
onmessage = (e: MessageEvent) => port || rpcProvider.dispatch(e.data);

rpcProvider.registerRpcHandler('/use-port', (newPort: MessagePort) => {
    if (!(port || portPending)) {
        portPending = newPort;
        return Promise.resolve();
    } else {
        return Promise.reject('RPC already switched to message port');
    }
});

export function getRpc(): RpcProviderInterface {
    return rpcProvider;
}
