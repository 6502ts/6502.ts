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

import {RpcProviderInterface, RpcProvider} from 'worker-rpc';
import {Event} from 'microevent.ts';

import * as messages from './messages';
import ArrayBufferSurface from '../../surface/ArrayBufferSurface';
import PoolMemberInterface from '../../../tools/pool/PoolMemberInterface';
import {ProcessorConfig} from '../config';

class PipelineClient {

    constructor(
        private _rpc: RpcProviderInterface
    ) {
        this._rpc
            .registerSignalHandler(messages.messageIds.emit, this._onMessageEmit.bind(this))
            .registerSignalHandler(messages.messageIds.release, this._onMessageRelease.bind(this));
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

    processSurface(managedSurface: PoolMemberInterface<ArrayBufferSurface>): Promise<any> {
        const id = this._nextId++,
            surface = managedSurface.get(),
            buffer = surface.getUnderlyingBuffer();

        this._surfaces.set(id, managedSurface);

        return this._rpc.rpc(messages.messageIds.process, {
            id,
            width: surface.getWidth(),
            height: surface.getHeight(),
            buffer
        } as messages.ProcessMessage, [buffer]);
    }

    static spawn(workerUrl = 'video-pipeline.js'): PipelineClient {
        const worker = new Worker(workerUrl),
            rpc = new RpcProvider(
                (message: any, transfer: Array<any>) => worker.postMessage(message, transfer)
            );

        worker.onmessage = messageEvent => rpc.dispatch(messageEvent.data);

        return new PipelineClient(rpc);
    }

    private _onMessageEmit(msg: messages.EmitMessage): void {
        if (!this._surfaces.has(msg.id)) {
            throw `no surface with id ${msg.id}`;
        }

        const managedSurface = this._surfaces.get(msg.id),
            surface = managedSurface.get();

        this._surfaces.delete(msg.id);
        surface.replaceUnderlyingBuffer(surface.getWidth(), surface.getHeight(), msg.buffer);

        this.emit.dispatch(managedSurface);
    }

    private _onMessageRelease(msg: messages.ReleaseMessage): void {
        if (!this._surfaces.has(msg.id)) {
            throw `no surface with id ${msg.id}`;
        }

        const managedSurface = this._surfaces.get(msg.id),
            surface = managedSurface.get();

        this._surfaces.delete(msg.id);
        surface.replaceUnderlyingBuffer(surface.getWidth(), surface.getHeight(), msg.buffer);

        managedSurface.release();;
    }

    emit = new Event<PoolMemberInterface<ArrayBufferSurface>>();

    private _nextId = 0;
    private _surfaces = new Map<number, PoolMemberInterface<ArrayBufferSurface>>();

}

export default PipelineClient;