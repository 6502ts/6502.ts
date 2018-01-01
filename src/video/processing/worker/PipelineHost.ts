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
