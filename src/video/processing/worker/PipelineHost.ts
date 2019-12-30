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

import { RpcProviderInterface } from 'worker-rpc';

import ArrayBufferSurface from '../../surface/ArrayBufferSurface';
import Pool from '../../../tools/pool/Pool';
import PoolMemberInterface from '../../../tools/pool/PoolMemberInterface';
import * as messages from './messages';
import ProcessorPipeline from '../ProcessorPipeline';

class PipelineHost {
    constructor(private _rpc: RpcProviderInterface) {
        this._rpc
            .registerRpcHandler(messages.messageIds.configure, this._onConfigure.bind(this))
            .registerRpcHandler(messages.messageIds.flush, this._onFlush.bind(this))
            .registerSignalHandler(messages.messageIds.process, this._onProcess.bind(this));

        this._surfacePool.event.release.addHandler(PipelineHost._onReleaseSurface, this);
    }

    private static _onReleaseSurface(surface: ArrayBufferSurface, self: PipelineHost): void {
        const buffer = surface.getUnderlyingBuffer();

        if (!buffer) {
            return;
        }

        if (!self._bufferIds.has(buffer)) {
            throw new Error('double release');
        }

        const id = self._bufferIds.get(buffer);
        self._bufferIds.delete(buffer);

        self._rpc.signal(
            messages.messageIds.release,
            {
                id,
                buffer
            } as messages.ReleaseMessage,
            [buffer]
        );
    }

    private static _onEmitSurface(managedSurface: PoolMemberInterface<ArrayBufferSurface>, self: PipelineHost): void {
        const buffer = managedSurface.get().getUnderlyingBuffer();

        if (!self._bufferIds.has(buffer)) {
            throw new Error('double release');
        }

        const id = self._bufferIds.get(buffer);
        self._bufferIds.delete(buffer);

        self._rpc.signal(
            messages.messageIds.emit,
            {
                id,
                buffer
            } as messages.EmitMessage,
            [buffer]
        );

        managedSurface.get().resetUnderlyingBuffer();
        managedSurface.release();
    }

    private _onConfigure(msg: messages.ConfigureMessage): void {
        if (this._pipeline) {
            this._pipeline.flush();
            this._pipeline.emit.removeHandler(PipelineHost._onEmitSurface, this);
        }

        this._pipeline = new ProcessorPipeline(msg.config);
        this._pipeline.init(msg.width, msg.height);
        this._pipeline.emit.addHandler(PipelineHost._onEmitSurface, this);
    }

    private _onFlush(msg: messages.FlushMessage): void {
        if (this._pipeline) {
            this._pipeline.flush();
        }
    }

    private _onProcess(msg: messages.ProcessMessage): void {
        if (!this._pipeline) {
            return;
        }

        this._bufferIds.set(msg.buffer, msg.id);

        const managedSurface = this._surfacePool.get();
        managedSurface.get().replaceUnderlyingBuffer(msg.width, msg.height, msg.buffer);

        this._pipeline.processSurface(managedSurface);
    }

    private _pipeline: ProcessorPipeline = null;
    private _surfacePool = new Pool<ArrayBufferSurface>(() => new ArrayBufferSurface());
    private _bufferIds = new WeakMap<ArrayBuffer, number>();
}

export { PipelineHost as default };
