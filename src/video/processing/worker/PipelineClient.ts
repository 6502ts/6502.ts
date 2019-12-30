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

import { RpcProviderInterface, RpcProvider } from 'worker-rpc';
import { Event } from 'microevent.ts';

import * as messages from './messages';
import ArrayBufferSurface from '../../surface/ArrayBufferSurface';
import PoolMemberInterface from '../../../tools/pool/PoolMemberInterface';
import { ProcessorConfig } from '../config';

class PipelineClient {
    constructor(private _rpc: RpcProviderInterface) {
        this._rpc
            .registerSignalHandler(messages.messageIds.emit, this._onMessageEmit.bind(this))
            .registerSignalHandler(messages.messageIds.release, this._onMessageRelease.bind(this));
    }

    static spawn(workerUrl = 'video-pipeline.js'): PipelineClient {
        const worker = new Worker(workerUrl),
            rpc = new RpcProvider((message: any, transfer: Array<any>) => worker.postMessage(message, transfer));

        worker.onmessage = messageEvent => rpc.dispatch(messageEvent.data);

        return new PipelineClient(rpc);
    }

    configure(width: number, height: number, videoConfig?: Array<ProcessorConfig>): Promise<any> {
        return this._rpc.rpc(messages.messageIds.configure, {
            width,
            height,
            config: videoConfig
        } as messages.ConfigureMessage);
    }

    flush(): Promise<any> {
        return this._rpc.rpc(messages.messageIds.flush);
    }

    processSurface(managedSurface: PoolMemberInterface<ArrayBufferSurface>): void {
        const id = this._nextId++,
            surface = managedSurface.get(),
            buffer = surface.getUnderlyingBuffer();

        this._surfaces.set(id, managedSurface);

        this._rpc.signal(
            messages.messageIds.process,
            {
                id,
                width: surface.getWidth(),
                height: surface.getHeight(),
                buffer
            } as messages.ProcessMessage,
            [buffer]
        );
    }

    private _onMessageEmit(msg: messages.EmitMessage): void {
        if (!this._surfaces.has(msg.id)) {
            throw new Error(`no surface with id ${msg.id}`);
        }

        const managedSurface = this._surfaces.get(msg.id),
            surface = managedSurface.get();

        this._surfaces.delete(msg.id);
        surface.replaceUnderlyingBuffer(surface.getWidth(), surface.getHeight(), msg.buffer);

        this.emit.dispatch(managedSurface);
    }

    private _onMessageRelease(msg: messages.ReleaseMessage): void {
        if (!this._surfaces.has(msg.id)) {
            throw new Error(`no surface with id ${msg.id}`);
        }

        const managedSurface = this._surfaces.get(msg.id),
            surface = managedSurface.get();

        this._surfaces.delete(msg.id);
        surface.replaceUnderlyingBuffer(surface.getWidth(), surface.getHeight(), msg.buffer);

        managedSurface.release();
    }

    emit = new Event<PoolMemberInterface<ArrayBufferSurface>>();

    private _nextId = 0;
    private _surfaces = new Map<number, PoolMemberInterface<ArrayBufferSurface>>();
}

export { PipelineClient as default };
