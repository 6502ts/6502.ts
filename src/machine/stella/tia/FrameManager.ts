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

import { Event } from 'microevent.ts';

import VideoOutputInterface from '../../io/VideoOutputInterface';
import RGBASurfaceInterface from '../../../video/surface/RGBASurfaceInterface';
import Config from '../Config';

const enum Metrics {
    vblankNTSC = 40,
    vblankPAL = 48,
    kernelNTSC = 192,
    kernelPAL = 228,
    overscanNTSC = 30,
    overscanPAL = 36,
    vsync = 3,
    visibleOverscan = 20,
    maxUnderscan = 10,
    maxLinesWithoutVsync = 50
}

const enum State {
    waitForVsyncStart,
    waitForVsyncEnd,
    waitForFrameStart,
    frame,
    overscan
}

export default class FrameManager {
    constructor(private _config: Config) {
        switch (this._config.tvMode) {
            case Config.TvMode.ntsc:
                this._vblankLines = Metrics.vblankNTSC;
                this._kernelLines = Metrics.kernelNTSC;
                this._overscanLines = Metrics.overscanNTSC;
                break;

            case Config.TvMode.pal:
            case Config.TvMode.secam:
                this._vblankLines = Metrics.vblankPAL;
                this._kernelLines = Metrics.kernelPAL;
                this._overscanLines = Metrics.overscanPAL;
                break;

            default:
                throw new Error(`invalid tv mode ${this._config.tvMode}`);
        }

        this._frameLines = this._vblankLines + this._kernelLines + this._overscanLines + Metrics.vsync;
        this._frameStart = this._config.frameStart;

        this.reset();
    }

    reset(): void {
        this.vblank = false;
        this.surfaceBuffer = null;
        this._linesWithoutVsync = 0;
        this._state = State.waitForVsyncStart;
        this._vsync = false;
        this._lineInState = 0;
        this._surface = null;
    }

    nextLine(): void {
        if (!this._surfaceFactory) {
            return;
        }

        this._lineInState++;

        switch (this._state) {
            case State.waitForVsyncStart:
            case State.waitForVsyncEnd:
                if (++this._linesWithoutVsync > Metrics.maxUnderscan) {
                    this._setState(State.waitForFrameStart);
                }

                break;

            case State.waitForFrameStart:
                if (this._frameStart >= 0) {
                    if (this._lineInState > this._frameStart) {
                        this._startFrame();
                    }
                } else {
                    if (
                        this._lineInState >=
                        (this.vblank ? this._vblankLines : this._vblankLines - Metrics.maxUnderscan)
                    ) {
                        this._startFrame();
                    }
                }

                break;

            case State.frame:
                if (this._lineInState >= this._kernelLines + Metrics.visibleOverscan) {
                    this._finalizeFrame();
                }
                break;

            case State.overscan:
                if (this._lineInState >= this._overscanLines - Metrics.visibleOverscan) {
                    this._setState(State.waitForVsyncStart);
                }
                break;
        }
    }

    isRendering(): boolean {
        return this._state === State.frame && !!this._surface;
    }

    setVblank(vblank: boolean): void {
        if (this._surfaceFactory) {
            this.vblank = vblank;
        }
    }

    setVsync(vsync: boolean): void {
        if (!this._surfaceFactory || vsync === this._vsync) {
            return;
        }

        this._vsync = vsync;

        switch (this._state) {
            case State.waitForVsyncStart:
                this._linesWithoutVsync = 0;
            case State.waitForFrameStart:
            case State.overscan:
                if (vsync) {
                    this._setState(State.waitForVsyncEnd);
                }
                break;

            case State.waitForVsyncEnd:
                if (!vsync) {
                    this._setState(State.waitForFrameStart);
                }
                break;

            case State.frame:
                if (vsync) {
                    // State is reset by finalizeFrame
                    this._finalizeFrame();
                }
                break;
        }
    }

    getHeight(): number {
        return this._kernelLines + Metrics.visibleOverscan;
    }

    setSurfaceFactory(factory: VideoOutputInterface.SurfaceFactoryInterface): void {
        this._surfaceFactory = factory;
    }

    getCurrentLine(): number {
        return this._state === State.frame ? this._lineInState : 0;
    }

    getDebugState(): string {
        return `${this._getReadableState()}, line = ${this._lineInState}, ` + `vblank = ${this.vblank ? '1' : '0'}`;
    }

    private _getReadableState(): string {
        switch (this._state) {
            case State.waitForVsyncStart:
                return `wait for vsync start`;

            case State.waitForVsyncEnd:
                return `wait for vsync end`;

            case State.waitForFrameStart:
                return `wait for frame start`;

            case State.frame:
                return `frame`;

            case State.overscan:
                return `overscan`;
        }
    }

    private _startFrame(): void {
        this._setState(State.frame);
        this._surface = this._surfaceFactory();
        this.surfaceBuffer = this._surface.getBuffer();
    }

    private _finalizeFrame(): void {
        if (this._state !== State.frame) {
            throw new Error(`finalize frame in invalid state ${this._state}`);
        }

        this.newFrame.dispatch(this._surface);
        this._setState(State.overscan);
    }

    private _setState(newState: State) {
        this._state = newState;
        this._lineInState = 0;
    }

    newFrame = new Event<RGBASurfaceInterface>();

    vblank = false;
    surfaceBuffer: RGBASurfaceInterface.BufferInterface = null;

    private _vblankLines = 0;
    private _kernelLines = 0;
    private _overscanLines = 0;
    private _frameLines = 0;

    private _linesWithoutVsync = 0;
    private _state = State.waitForVsyncStart;

    private _vsync = false;
    private _lineInState = 0;

    private _surfaceFactory: VideoOutputInterface.SurfaceFactoryInterface = null;
    private _surface: RGBASurfaceInterface = null;

    private _frameStart = -1;
}
