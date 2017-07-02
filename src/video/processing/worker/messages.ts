/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

import {ProcessorConfig} from '../config';

export const messageIds = {
    configure: 'pipeline/configure',
    flush: 'pipeline/flush',
    process: 'pipeline/process',
    emit: 'pipeline/emit',
    release: 'pipeline/release'
};
Object.freeze(messageIds);

export interface ConfigureMessage {
    width: number;
    height: number;
    config: Array<ProcessorConfig>;
}

export interface FlushMessage {}

export interface ProcessMessage {
    id: number;
    buffer: ArrayBuffer;
    width: number;
    height: number;
}

export interface EmitMessage {
    id: number;
    buffer: ArrayBuffer;
}

export interface ReleaseMessage {
    id: number;
    buffer: ArrayBuffer;
}
