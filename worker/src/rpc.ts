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
