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

import { Event } from 'microevent.ts';

import VideoOutputInterface from '../../io/VideoOutputInterface';
import WaveformAudioOutputInterface from '../../io/WaveformAudioOutputInterface';
import PCMAudioOutputInterface from '../../io/PCMAudioOutputInterface';
import DigitalJoystickInterface from '../../io/DigitalJoystickInterface';
import RGBASurfaceInterface from '../../../video/surface/RGBASurfaceInterface';
import Config from '../Config';
import CpuInterface from '../../cpu/CpuInterface';
import WaveformAudio from './WaveformAudio';
import PCMAudio from './PCMAudio';
import AudioInterface from './AudioInterface';
import Paddle from '../../io/Paddle';
import Bus from '../Bus';

import Missile from './Missile';
import Playfield from './Playfield';
import Player from './Player';
import Ball from './Ball';
import LatchedInput from './LatchedInput';
import PaddleReader from './PaddleReader';
import FrameManager from './FrameManager';
import DelayQueue from './DelayQueue';
import * as palette from './palette';

const enum Metrics {
    frameLinesPAL = 312,
    frameLinesNTSC = 262
}

const enum Delay {
    hmove = 6,
    pf = 2,
    grp = 1,
    shufflePlayer = 1,
    shuffleBall = 1,
    hmp = 2,
    hmm = 2,
    hmbl = 2,
    hmclr = 2,
    refp = 1,
    vblank = 1,
    enabl = 1,
    enam = 1
}

const enum ResxCounter {
    hblank = 159,
    lateHblank = 158,
    frame = 157,
    // This parameter still has room for tuning. If we go lower than 73, long005 will show
    // a slight artifact (still have to crosscheck on real hardware), if we go lower than
    // 70, the G.I. Joe will show an artifact (hole in roof).
    lateHblankThreshold = 73
}

// Each bit in the collision mask identifies a single collision pair
const enum CollisionMask {
    player0 = 0b0111110000000000,
    player1 = 0b0100001111000000,
    missile0 = 0b0010001000111000,
    missile1 = 0b0001000100100110,
    ball = 0b0000100010010101,
    playfield = 0b0000010001001011
}

const enum HState {
    blank,
    frame
}
const enum Priority {
    normal,
    pfp,
    score
}

class Tia implements VideoOutputInterface {
    constructor(
        private _config: Config,
        joystick0: DigitalJoystickInterface,
        joystick1: DigitalJoystickInterface,
        paddles: Array<Paddle>
    ) {
        this._frameManager = new FrameManager(this._config);
        this._frameManager.newFrame.addHandler(Tia._onNewFrame, this);

        this._palette = this._getPalette(this._config);
        this._input0 = new LatchedInput(joystick0.getFire());
        this._input1 = new LatchedInput(joystick1.getFire());

        this._pcmAudio = new PCMAudio(this._config);
        const pcmChannels = this._pcmAudio.getChannels();

        for (let i = 0; i < 2; i++) {
            this._waveformAudio[i] = new WaveformAudio(this._config);

            this._audio[i] = this._config.pcmAudio ? pcmChannels[i] : this._waveformAudio[i];
        }

        const clockFreq = this._getClockFreq(this._config);

        this._paddles = new Array(4);
        for (let i = 0; i < 4; i++) {
            this._paddles[i] = new PaddleReader(clockFreq, paddles[i]);
        }

        this.reset();
    }

    reset(): void {
        this._hctr = 0;
        this._movementInProgress = false;
        this._extendedHblank = false;
        this._movementClock = 0;
        this._priority = Priority.normal;
        this._hstate = HState.blank;
        this._collisionMask = 0;
        this._colorBk = 0xff000000;
        this._linesSinceChange = 0;
        this._collisionUpdateRequired = false;
        this._maxLinesTotal = 0;
        this._xDelta = 0;

        this._delayQueue.reset();
        this._frameManager.reset();

        this._missile0.reset();
        this._missile1.reset();
        this._player0.reset();
        this._player1.reset();
        this._playfield.reset();
        this._ball.reset();

        this._audio[0].reset();
        this._audio[1].reset();

        this._input0.reset();
        this._input1.reset();

        for (let i = 0; i < 4; i++) {
            this._paddles[i].reset();
        }

        if (this._cpu) {
            this._cpu.resume();
        }
    }

    setCpu(cpu: CpuInterface): Tia {
        this._cpu = cpu;

        return this;
    }

    setCpuTimeProvider(provider: () => number): this {
        for (let i = 0; i < 4; i++) {
            this._paddles[i].setCpuTimeProvider(provider);
        }

        return this;
    }

    getWidth(): number {
        return 160;
    }

    getHeight(): number {
        return this._frameManager.getHeight();
    }

    setSurfaceFactory(factory: VideoOutputInterface.SurfaceFactoryInterface): Tia {
        this._frameManager.setSurfaceFactory(factory);

        return this;
    }

    getWaveformChannel(i: number): WaveformAudioOutputInterface {
        return this._waveformAudio[i];
    }

    getPCMChannel(): PCMAudioOutputInterface {
        return this._pcmAudio;
    }

    setAudioEnabled(state: boolean): void {
        this._audio[0].setActive(state && this._config.enableAudio);
        this._audio[1].setActive(state && this._config.enableAudio);
    }

    read(address: number): number {
        const lastDataBusValue = this._bus.getLastDataBusValue();

        let result: number;

        // Only keep the lowest four bits
        switch (address & 0x0f) {
            case Tia.Registers.inpt0:
                result = this._config.emulatePaddles ? this._paddles[0].inpt() : 0;
                break;

            case Tia.Registers.inpt1:
                result = this._config.emulatePaddles ? this._paddles[1].inpt() : 0;
                break;

            case Tia.Registers.inpt2:
                result = this._config.emulatePaddles ? this._paddles[2].inpt() : 0;
                break;

            case Tia.Registers.inpt3:
                result = this._config.emulatePaddles ? this._paddles[3].inpt() : 0;
                break;

            case Tia.Registers.inpt4:
                result = this._input0.inpt();
                break;

            case Tia.Registers.inpt5:
                result = this._input1.inpt();
                break;

            case Tia.Registers.cxm0p:
                result =
                    (this._collisionMask & CollisionMask.missile0 & CollisionMask.player0 ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.missile0 & CollisionMask.player1 ? 0x80 : 0);
                break;

            case Tia.Registers.cxm1p:
                result =
                    (this._collisionMask & CollisionMask.missile1 & CollisionMask.player1 ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.missile1 & CollisionMask.player0 ? 0x80 : 0);
                break;

            case Tia.Registers.cxp0fb:
                result =
                    (this._collisionMask & CollisionMask.player0 & CollisionMask.ball ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.player0 & CollisionMask.playfield ? 0x80 : 0);
                break;

            case Tia.Registers.cxp1fb:
                result =
                    (this._collisionMask & CollisionMask.player1 & CollisionMask.ball ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.player1 & CollisionMask.playfield ? 0x80 : 0);
                break;

            case Tia.Registers.cxm0fb:
                result =
                    (this._collisionMask & CollisionMask.missile0 & CollisionMask.ball ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.missile0 & CollisionMask.playfield ? 0x80 : 0);
                break;

            case Tia.Registers.cxm1fb:
                result =
                    (this._collisionMask & CollisionMask.missile1 & CollisionMask.ball ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.missile1 & CollisionMask.playfield ? 0x80 : 0);
                break;

            case Tia.Registers.cxppmm:
                result =
                    (this._collisionMask & CollisionMask.missile0 & CollisionMask.missile1 ? 0x40 : 0) |
                    (this._collisionMask & CollisionMask.player0 & CollisionMask.player1 ? 0x80 : 0);
                break;

            case Tia.Registers.cxblpf:
                result = this._collisionMask & CollisionMask.ball & CollisionMask.playfield ? 0x80 : 0;
                break;

            default:
                result = 0;
                break;
        }

        return (result & 0xc0) | (lastDataBusValue & 0x3f);
    }

    peek(address: number): number {
        return this.read(address);
    }

    write(address: number, value: number): void {
        let v = 0;

        // Mask out A6 - A15
        switch (address & 0x3f) {
            case Tia.Registers.wsync:
                this._cpu.halt();
                break;

            case Tia.Registers.rsync:
                this._flushLineCache();
                this._rsync();
                break;

            case Tia.Registers.vsync:
                this._frameManager.setVsync((value & 0x02) > 0);
                break;

            case Tia.Registers.vblank:
                this._input0.vblank(value);
                this._input1.vblank(value);

                for (let i = 0; i < 4; i++) {
                    this._paddles[i].vblank(value);
                }

                this._delayQueue.push(Tia.Registers.vblank, value, Delay.vblank);
                break;

            case Tia.Registers.enam0:
                this._delayQueue.push(Tia.Registers.enam0, value, Delay.enam);
                break;

            case Tia.Registers.enam1:
                this._delayQueue.push(Tia.Registers.enam1, value, Delay.enam);
                break;

            case Tia.Registers.hmm0:
                this._delayQueue.push(Tia.Registers.hmm0, value, Delay.hmm);
                break;

            case Tia.Registers.hmm1:
                this._delayQueue.push(Tia.Registers.hmm1, value, Delay.hmm);
                break;

            case Tia.Registers.resm0:
                this._flushLineCache();
                this._missile0.resm(this._resxCounter(), this._hstate === HState.blank);
                break;

            case Tia.Registers.resm1:
                this._flushLineCache();
                this._missile1.resm(this._resxCounter(), this._hstate === HState.blank);
                break;

            case Tia.Registers.resmp0:
                this._missile0.resmp(value, this._player0);
                break;

            case Tia.Registers.resmp1:
                this._missile1.resmp(value, this._player1);
                break;

            case Tia.Registers.hmclr:
                this._delayQueue.push(Tia.Registers.hmclr, value, Delay.hmclr);
                break;

            case Tia.Registers.nusiz0:
                this._flushLineCache();
                this._missile0.nusiz(value);
                this._player0.nusiz(value, this._hstate === HState.blank);
                break;

            case Tia.Registers.nusiz1:
                this._flushLineCache();
                this._missile1.nusiz(value);
                this._player1.nusiz(value, this._hstate === HState.blank);
                break;

            case Tia.Registers.hmove:
                this._delayQueue.push(Tia.Registers.hmove, value, Delay.hmove);
                break;

            case Tia.Registers.colubk:
                this._flushLineCache();
                this._colorBk = this._palette[(value & 0xff) >>> 1];
                break;

            case Tia.Registers.colup0:
                v = this._palette[(value & 0xff) >>> 1];
                this._missile0.setColor(v);
                this._player0.setColor(v);
                this._playfield.setColorP0(v);

                break;

            case Tia.Registers.colup1:
                v = this._palette[(value & 0xff) >>> 1];
                this._missile1.setColor(v);
                this._player1.setColor(v);
                this._playfield.setColorP1(v);

                break;

            case Tia.Registers.pf0:
                this._delayQueue.push(Tia.Registers.pf0, value, Delay.pf);
                break;

            case Tia.Registers.pf1:
                this._delayQueue.push(Tia.Registers.pf1, value, Delay.pf);
                break;

            case Tia.Registers.pf2:
                this._delayQueue.push(Tia.Registers.pf2, value, Delay.pf);
                break;

            case Tia.Registers.ctrlpf:
                this._setPriority(value);
                this._playfield.ctrlpf(value);
                this._ball.ctrlpf(value);
                break;

            case Tia.Registers.colupf:
                this._flushLineCache();
                v = this._palette[(value & 0xff) >>> 1];
                this._playfield.setColor(v);
                this._ball.color = v;
                break;

            case Tia.Registers.grp0:
                this._delayQueue
                    .push(Tia.Registers.grp0, value, Delay.grp)
                    .push(Tia.Registers._shuffleP1, 0, Delay.shufflePlayer);

                break;

            case Tia.Registers.grp1:
                this._delayQueue
                    .push(Tia.Registers.grp1, value, Delay.grp)
                    .push(Tia.Registers._shuffleP0, 0, Delay.shufflePlayer)
                    .push(Tia.Registers._shuffleBL, 0, Delay.shuffleBall);

                break;

            case Tia.Registers.resp0:
                this._flushLineCache();
                this._player0.resp(this._resxCounter());
                break;

            case Tia.Registers.resp1:
                this._flushLineCache();
                this._player1.resp(this._resxCounter());
                break;

            case Tia.Registers.refp0:
                this._delayQueue.push(Tia.Registers.refp0, value, Delay.refp);
                break;

            case Tia.Registers.refp1:
                this._delayQueue.push(Tia.Registers.refp1, value, Delay.refp);
                break;

            case Tia.Registers.hmp0:
                this._delayQueue.push(Tia.Registers.hmp0, value, Delay.hmp);
                break;

            case Tia.Registers.hmp1:
                this._delayQueue.push(Tia.Registers.hmp1, value, Delay.hmp);
                break;

            case Tia.Registers.vdelp0:
                this._player0.vdelp(value);
                break;

            case Tia.Registers.vdelp1:
                this._player1.vdelp(value);
                break;

            case Tia.Registers.enabl:
                this._delayQueue.push(Tia.Registers.enabl, value, Delay.enabl);
                break;

            case Tia.Registers.hmbl:
                this._delayQueue.push(Tia.Registers.hmbl, value, Delay.hmbl);
                break;

            case Tia.Registers.resbl:
                this._flushLineCache();
                this._ball.resbl(this._resxCounter());
                break;

            case Tia.Registers.vdelbl:
                this._ball.vdelbl(value);
                break;

            case Tia.Registers.cxclr:
                this._flushLineCache();
                this._collisionMask = 0;
                break;

            case Tia.Registers.audc0:
                this._audio[0].audc(value);
                break;

            case Tia.Registers.audc1:
                this._audio[1].audc(value);
                break;

            case Tia.Registers.audf0:
                this._audio[0].audf(value);
                break;

            case Tia.Registers.audf1:
                this._audio[1].audf(value);
                break;

            case Tia.Registers.audv0:
                this._audio[0].audv(value);
                break;

            case Tia.Registers.audv1:
                this._audio[1].audv(value);
                break;
        }
    }

    getDebugState(): string {
        return (
            '' +
            `hclock: ${this._hctr}   line: ${this._frameManager.getCurrentLine()}\n` +
            this._frameManager.getDebugState()
        );
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    cycle(): void {
        this._delayQueue.execute(Tia._delayedWrite, this);

        this._collisionUpdateRequired = false;

        if (this._linesSinceChange < 2) {
            this._tickMovement();

            if (this._hstate === HState.blank) {
                this._tickHblank();
            } else {
                this._tickHframe();
            }

            if (this._collisionUpdateRequired && !this._frameManager.vblank) {
                this._updateCollision();
            }
        } else {
            if (this._hctr === 0) {
                this._cpu.resume();
            }
        }

        if (++this._hctr >= 228) {
            this._nextLine();
        }

        if (this._config.pcmAudio) {
            this._pcmAudio.tick();
        }
    }

    private static _delayedWrite(address: number, value: number, self: Tia): void {
        switch (address) {
            case Tia.Registers.vblank:
                self._flushLineCache();
                self._frameManager.setVblank((value & 0x02) > 0);
                break;

            case Tia.Registers.hmove:
                self._flushLineCache();

                // Start the timer and increase hblank
                self._movementClock = 0;
                self._movementInProgress = true;

                if (!self._extendedHblank) {
                    self._clearHmoveComb();
                    self._extendedHblank = true;
                }

                // Start sprite movement
                self._missile0.startMovement();
                self._missile1.startMovement();
                self._player0.startMovement();
                self._player1.startMovement();
                self._ball.startMovement();

                break;

            case Tia.Registers.pf0:
                self._playfield.pf0(value);
                break;

            case Tia.Registers.pf1:
                self._playfield.pf1(value);
                break;

            case Tia.Registers.pf2:
                self._playfield.pf2(value);
                break;

            case Tia.Registers.grp0:
                self._player0.grp(value);
                break;

            case Tia.Registers.grp1:
                self._player1.grp(value);
                break;

            case Tia.Registers._shuffleP0:
                self._player0.shufflePatterns();
                break;

            case Tia.Registers._shuffleP1:
                self._player1.shufflePatterns();
                break;

            case Tia.Registers.hmp0:
                self._player0.hmp(value);
                break;

            case Tia.Registers.hmp1:
                self._player1.hmp(value);
                break;

            case Tia.Registers.hmm0:
                self._missile0.hmm(value);
                break;

            case Tia.Registers.hmm1:
                self._missile1.hmm(value);
                break;

            case Tia.Registers.hmbl:
                self._ball.hmbl(value);
                break;

            case Tia.Registers.hmclr:
                self._missile0.hmm(0);
                self._missile1.hmm(0);
                self._player0.hmp(0);
                self._player1.hmp(0);
                self._ball.hmbl(0);
                break;

            case Tia.Registers.refp0:
                self._player0.refp(value);
                break;

            case Tia.Registers.refp1:
                self._player1.refp(value);
                break;

            case Tia.Registers._shuffleBL:
                self._ball.shuffleStatus();
                break;

            case Tia.Registers.enabl:
                self._ball.enabl(value);
                break;

            case Tia.Registers.enam0:
                self._missile0.enam(value);
                break;

            case Tia.Registers.enam1:
                self._missile1.enam(value);
                break;
        }
    }

    private static _onNewFrame(surface: RGBASurfaceInterface, self: Tia): void {
        const linesTotal = self._frameManager.getCurrentLine();

        if (linesTotal > self._maxLinesTotal) {
            self._maxLinesTotal = linesTotal;
        }

        if (linesTotal < self._maxLinesTotal) {
            const buffer = surface.getBuffer(),
                base = 160 * linesTotal,
                boundary = self._maxLinesTotal * 160;

            for (let i = base; i < boundary; i++) {
                buffer[i] = 0xff000000;
            }
        }

        self.newFrame.dispatch(surface);
    }

    private _tickMovement(): void {
        if (!this._movementInProgress) {
            return;
        }

        // color clock mod 4
        if ((this._hctr & 0x3) === 0) {
            // The tick is only propagated to the sprite counters if we are in blank
            // mode --- in frame mode, it overlaps with the sprite clock and is gobbled.
            const apply = this._hstate === HState.blank;

            // did any sprite receive the clock?
            let m = false;

            const movementCounter = this._movementClock > 15 ? 0 : this._movementClock;

            m = this._missile0.movementTick(movementCounter, apply) || m;
            m = this._missile1.movementTick(movementCounter, apply) || m;
            m = this._player0.movementTick(movementCounter, apply) || m;
            m = this._player1.movementTick(movementCounter, apply) || m;
            m = this._ball.movementTick(movementCounter, apply) || m;

            // stop collision counter if all latches were cleared
            this._movementInProgress = m;

            // the collision latches must be updated if any sprite received a tick
            this._collisionUpdateRequired = m;

            this._movementClock++;
        }
    }

    private _tickHblank() {
        switch (this._hctr) {
            case 0:
                this._extendedHblank = false;
                this._cpu.resume();
                break;

            case 67:
                if (!this._extendedHblank) {
                    this._hstate = HState.frame;
                }

                break;

            case 75:
                if (this._extendedHblank) {
                    this._hstate = HState.frame;
                }

                break;
        }

        if (this._extendedHblank && this._hctr > 67) {
            this._playfield.tick(this._hctr - 68 + this._xDelta);
        }
    }

    private _tickHframe() {
        const y = this._frameManager.getCurrentLine(),
            x = this._hctr - 68 + this._xDelta;

        // collision latches must be updated if we cannot use cached line daa
        this._collisionUpdateRequired = true;

        // The playfield does not have its own counter and must be cycled before rendering the sprites.
        this._playfield.tick(x);

        // spin sprite timers
        this._tickSprites();

        // render pixel data
        if (this._frameManager.isRendering()) {
            this._renderPixel(x, y);
        }
    }

    private _tickSprites() {
        this._missile0.tick(true);
        this._missile1.tick(true);
        this._player0.tick();
        this._player1.tick();
        this._ball.tick(true);
    }

    private _nextLine() {
        if (this._linesSinceChange >= 2) {
            this._cloneLastLine();
        }

        // Reset the counters
        this._hctr = 0;

        this._playfield.tick(0);

        if (!this._movementInProgress) {
            this._linesSinceChange++;
        }

        this._hstate = HState.blank;
        this._xDelta = 0;

        this._frameManager.nextLine();

        if (this._frameManager.isRendering() && this._frameManager.getCurrentLine() === 0) {
            this._flushLineCache();
        }
    }

    private _cloneLastLine(): void {
        const y = this._frameManager.getCurrentLine();

        if (!this._frameManager.isRendering() || y === 0) {
            return;
        }

        const delta = y * 160,
            prevDelta = (y - 1) * 160;

        for (let x = 0; x < 160; x++) {
            this._frameManager.surfaceBuffer[delta + x] = this._frameManager.surfaceBuffer[prevDelta + x];
        }
    }

    private _getPalette(config: Config) {
        switch (config.tvMode) {
            case Config.TvMode.ntsc:
                return palette.NTSC;

            case Config.TvMode.pal:
                return palette.PAL;

            case Config.TvMode.secam:
                return palette.SECAM;

            default:
                throw new Error('invalid TV mode');
        }
    }

    private _getClockFreq(config: Config) {
        return config.tvMode === Config.TvMode.ntsc
            ? 60 * 228 * Metrics.frameLinesNTSC
            : 50 * 228 * Metrics.frameLinesPAL;
    }

    private _renderPixel(x: number, y: number): void {
        if (this._frameManager.vblank) {
            this._frameManager.surfaceBuffer[y * 160 + x] = 0xff000000;
            return;
        }

        let color = this._colorBk;

        switch (this._priority) {
            case Priority.normal:
                color = this._playfield.getPixel(color);
                color = this._ball.getPixel(color);
                color = this._missile1.getPixel(color);
                color = this._player1.getPixel(color);
                color = this._missile0.getPixel(color);
                color = this._player0.getPixel(color);
                break;

            case Priority.pfp:
                color = this._missile1.getPixel(color);
                color = this._player1.getPixel(color);
                color = this._missile0.getPixel(color);
                color = this._player0.getPixel(color);
                color = this._playfield.getPixel(color);
                color = this._ball.getPixel(color);
                break;

            case Priority.score:
                color = this._ball.getPixel(color);
                color = this._missile1.getPixel(color);
                color = this._player1.getPixel(color);
                color = this._playfield.getPixel(color);
                color = this._missile0.getPixel(color);
                color = this._player0.getPixel(color);
                break;

            default:
                throw new Error('invalid priority');
        }

        this._frameManager.surfaceBuffer[y * 160 + x] = color;
    }

    private _updateCollision() {
        this._collisionMask |=
            ~this._player0.collision &
            ~this._player1.collision &
            ~this._missile0.collision &
            ~this._missile1.collision &
            ~this._ball.collision &
            ~this._playfield.collision;
    }

    private _clearHmoveComb(): void {
        if (this._frameManager.isRendering() && this._hstate === HState.blank) {
            const offset = this._frameManager.getCurrentLine() * 160;

            for (let i = 0; i < 8; i++) {
                this._frameManager.surfaceBuffer[offset + i] = 0xff000000;
            }
        }
    }

    private _resxCounter(): number {
        return this._hstate === HState.blank
            ? this._hctr >= ResxCounter.lateHblankThreshold ? ResxCounter.lateHblank : ResxCounter.hblank
            : ResxCounter.frame;
    }

    private _rsync(): void {
        const x = this._hctr > 68 ? this._hctr - 68 : 0;

        this._xDelta = 157 - x;

        if (this._frameManager.isRendering()) {
            const y = this._frameManager.getCurrentLine(),
                base = y * 160 + x,
                boundary = base + (y + 1) * 160;

            for (let i = base; i < boundary; i++) {
                this._frameManager.surfaceBuffer[i] = 0xff000000;
            }
        }

        this._hctr = 225;
    }

    private _setPriority(value: number): void {
        const priority = value & 0x04 ? Priority.pfp : value & 0x02 ? Priority.score : Priority.normal;

        if (priority !== this._priority) {
            this._flushLineCache();
            this._priority = priority;
        }
    }

    private _flushLineCache(): void {
        const wasCaching = this._linesSinceChange >= 2;

        this._linesSinceChange = 0;

        if (wasCaching) {
            const rewindCycles = this._hctr;

            for (this._hctr = 0; this._hctr < rewindCycles; this._hctr++) {
                if (this._hstate === HState.blank) {
                    this._tickHblank();
                } else {
                    this._tickHframe();
                }
            }
        }
    }

    newFrame = new Event<RGBASurfaceInterface>();

    trap = new Event<Tia.TrapPayload>();

    private _cpu: CpuInterface = null;
    private _bus: Bus = null;

    private _frameManager: FrameManager;
    private _delayQueue = new DelayQueue(10, 20);

    private _palette: Uint32Array;

    private _hstate = HState.blank;

    // hclock counter
    private _hctr = 0;
    // collision latch update required?
    private _collisionUpdateRequired = false;
    // Count the extra clocks triggered by move
    private _movementClock = 0;
    // Is the movement clock active and shoud pulse?
    private _movementInProgress = false;
    // do we have an extended hblank triggered by hmove?
    private _extendedHblank = false;
    // Delta during x calculation. Can become temporarily nonzero aftern a rsync.
    private _xDelta = 0;

    // Lines since the last cache-invalidating change. If this is > 1 we can safely use the linecache
    private _linesSinceChange = 0;

    // Max total lines. Used to clear garbage lines.
    private _maxLinesTotal = 0;

    private _colorBk = 0xff000000;
    private _priority = Priority.normal;
    // bitfield with collision latches
    private _collisionMask = 0;

    private _player0 = new Player(CollisionMask.player0, () => this._flushLineCache());
    private _player1 = new Player(CollisionMask.player1, () => this._flushLineCache());
    private _missile0 = new Missile(CollisionMask.missile0, () => this._flushLineCache());
    private _missile1 = new Missile(CollisionMask.missile1, () => this._flushLineCache());
    private _playfield = new Playfield(CollisionMask.playfield, () => this._flushLineCache());
    private _ball = new Ball(CollisionMask.ball, () => this._flushLineCache());

    private _waveformAudio = new Array<WaveformAudio>(2);
    private _pcmAudio: PCMAudio = null;
    private _audio = new Array<AudioInterface>(2);

    private _input0: LatchedInput;
    private _input1: LatchedInput;

    private _paddles: Array<PaddleReader>;
}

namespace Tia {
    export const enum Registers {
        vsync = 0x00,
        vblank = 0x01,
        wsync = 0x02,
        rsync = 0x03,
        nusiz0 = 0x04,
        nusiz1 = 0x05,
        colup0 = 0x06,
        colup1 = 0x07,
        colupf = 0x08,
        colubk = 0x09,
        ctrlpf = 0x0a,
        refp0 = 0x0b,
        refp1 = 0x0c,
        pf0 = 0x0d,
        pf1 = 0x0e,
        pf2 = 0x0f,
        resp0 = 0x10,
        resp1 = 0x11,
        resm0 = 0x12,
        resm1 = 0x13,
        resbl = 0x14,
        audc0 = 0x15,
        audc1 = 0x16,
        audf0 = 0x17,
        audf1 = 0x18,
        audv0 = 0x19,
        audv1 = 0x1a,
        grp0 = 0x1b,
        grp1 = 0x1c,
        enam0 = 0x1d,
        enam1 = 0x1e,
        enabl = 0x1f,
        hmp0 = 0x20,
        hmp1 = 0x21,
        hmm0 = 0x22,
        hmm1 = 0x23,
        hmbl = 0x24,
        vdelp0 = 0x25,
        vdelp1 = 0x26,
        vdelbl = 0x27,
        resmp0 = 0x28,
        resmp1 = 0x29,
        hmove = 0x2a,
        hmclr = 0x2b,
        cxclr = 0x2c,
        cxm0p = 0x00,
        cxm1p = 0x01,
        cxp0fb = 0x02,
        cxp1fb = 0x03,
        cxm0fb = 0x04,
        cxm1fb = 0x05,
        cxblpf = 0x06,
        cxppmm = 0x07,
        inpt0 = 0x08,
        inpt1 = 0x09,
        inpt2 = 0x0a,
        inpt3 = 0x0b,
        inpt4 = 0x0c,
        inpt5 = 0x0d,

        // These "registers" are not exposed to the system and only used in delaying
        // internal processes.
        _shuffleP0 = 0xf0,
        _shuffleP1 = 0xf1,
        _shuffleBL = 0xf2
    }

    export const enum TrapReason {
        invalidRead,
        invalidWrite
    }

    export class TrapPayload {
        constructor(public reason: TrapReason, public tia: Tia, public message?: string) { }
    }
}

export { Tia as default };
