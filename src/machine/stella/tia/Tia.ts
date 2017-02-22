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

import {Event} from 'microevent.ts';

import VideoOutputInterface from '../../io/VideoOutputInterface';
import AudioOutputInterface from '../../io/AudioOutputInterface';
import DigitalJoystickInterface from '../../io/DigitalJoystickInterface';
import RGBASurfaceInterface from '../../../video/surface/RGBASurfaceInterface';
import Config from '../Config';
import CpuInterface from '../../cpu/CpuInterface';
import Audio from './Audio';
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
    frameLinesPAL        = 312,
    frameLinesNTSC       = 262
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
    player0 =       0b0111110000000000,
    player1 =       0b0100001111000000,
    missile0 =      0b0010001000111000,
    missile1 =      0b0001000100100110,
    ball =          0b0000100010010101,
    playfield =     0b0000010001001011
}

const enum HState {blank, frame};
const enum Priority {normal, pfp, score};

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
        this._audio0 = new Audio(this._config);
        this._audio1 = new Audio(this._config);

        const clockFreq = this._getClockFreq(this._config);

        this._paddles = new Array(4);
        for (let i = 0; i < 4; i++) {
            this._paddles[i] = new PaddleReader(clockFreq, () => this._clock, paddles[i]);
        }

        this.reset();
    }

    reset(): void {
        this._hblankCtr = 0;
        this._hctr = 0;
        this._movementInProgress = false;
        this._extendedHblank = false;
        this._movementClock = 0;
        this._priority = Priority.normal;
        this._hstate = HState.blank;
        this._freshLine = true;
        this._collisionMask = 0;
        this._colorBk = 0xFF000000;
        this._linesSinceChange = 0;
        this._collisionUpdateRequired = false;
        this._clock = 0.;
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

        this._audio0.reset();
        this._audio1.reset();

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

    getAudioChannel0(): AudioOutputInterface {
        return this._audio0;
    }

    getAudioChannel1(): AudioOutputInterface {
        return this._audio1;
    }

    setAudioEnabled(state: boolean): void {
        this._audio0.setActive(state && this._config.enableAudio);
        this._audio1.setActive(state && this._config.enableAudio);
    }

    read(address: number): number {
        const lastDataBusValue = this._bus.getLastDataBusValue();

        let result: number;

        // Only keep the lowest four bits
        switch (address & 0x0F) {
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
                result = (
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.player0) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.player1) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxm1p:
                result = (
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.player1) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.player0) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxp0fb:
                result = (
                    ((this._collisionMask & CollisionMask.player0 & CollisionMask.ball) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.player0 & CollisionMask.playfield) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxp1fb:
                result = (
                    ((this._collisionMask & CollisionMask.player1 & CollisionMask.ball) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.player1 & CollisionMask.playfield) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxm0fb:
                result = (
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.ball) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.playfield) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxm1fb:
                result = (
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.ball) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.playfield) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxppmm:
                result = (
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.missile1) ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.player0 & CollisionMask.player1) ? 0x80 : 0)
                );
                break;

            case Tia.Registers.cxblpf:
                result = (this._collisionMask & CollisionMask.ball & CollisionMask.playfield) ? 0x80 : 0;
                break;

            default:
                result = lastDataBusValue;
                break;
        }

        return (result & 0xC0) | (lastDataBusValue & 0x3F);
    }

    peek(address: number): number {
        return this.read(address);
    }

    write(address: number, value: number): void {
        let v = 0;

        // Mask out A6 - A15
        switch (address & 0x3F) {
            case Tia.Registers.wsync:
                this._cpu.halt();
                break;

            case Tia.Registers.rsync:
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
                this._linesSinceChange = 0;
                this._missile0.resm(this._resxCounter(), this._hstate === HState.blank);
                break;

            case Tia.Registers.resm1:
                this._linesSinceChange = 0;
                this._missile1.resm(this._resxCounter(), this._hstate === HState.blank);
                break;

            case Tia.Registers.resmp0:
                this._linesSinceChange = 0;
                this._missile0.resmp(value, this._player0);
                break;

            case Tia.Registers.resmp1:
                this._linesSinceChange = 0;
                this._missile1.resmp(value, this._player1);
                break;

            case Tia.Registers.hmclr:
                this._delayQueue.push(Tia.Registers.hmclr, value, Delay.hmclr);
                break;

            case Tia.Registers.nusiz0:
                this._linesSinceChange = 0;
                this._missile0.nusiz(value);
                this._player0.nusiz(value);
                break;

            case Tia.Registers.nusiz1:
                this._linesSinceChange = 0;
                this._missile1.nusiz(value);
                this._player1.nusiz(value);
                break;

            case Tia.Registers.hmove:
                this._delayQueue.push(Tia.Registers.hmove, value, Delay.hmove);
                break;

            case Tia.Registers.colubk:
                this._linesSinceChange = 0;
                this._colorBk = this._palette[(value & 0xFF) >>> 1];
                break;

            case Tia.Registers.colup0:
                this._linesSinceChange = 0;

                v = this._palette[(value & 0xFF) >>> 1];
                this._missile0.color = v;
                this._player0.color = v;
                this._playfield.setColorP0(v);

                break;

            case Tia.Registers.colup1:
                this._linesSinceChange = 0;

                v = this._palette[(value & 0xFF) >>> 1];
                this._missile1.color = v;
                this._player1.color = v;
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
                this._linesSinceChange = 0;
                this._priority = (value & 0x04) ? Priority.pfp :
                                ((value & 0x02) ? Priority.score : Priority.normal);
                this._playfield.ctrlpf(value);
                this._ball.ctrlpf(value);
                break;

            case Tia.Registers.colupf:
                this._linesSinceChange = 0;
                v = this._palette[(value & 0xFF) >>> 1];
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
                this._linesSinceChange = 0;
                this._player0.resp(this._resxCounter());
                break;

            case Tia.Registers.resp1:
                this._linesSinceChange = 0;
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
                this._linesSinceChange = 0;
                this._player0.vdelp(value);
                break;

            case Tia.Registers.vdelp1:
                this._linesSinceChange = 0;
                this._player1.vdelp(value);
                break;

            case Tia.Registers.enabl:
                this._delayQueue.push(Tia.Registers.enabl, value, Delay.enabl);
                break;

            case Tia.Registers.hmbl:
                this._delayQueue.push(Tia.Registers.hmbl, value, Delay.hmbl);
                break;

            case Tia.Registers.resbl:
                this._linesSinceChange = 0;
                this._ball.resbl(this._resxCounter());
                break;

            case Tia.Registers.vdelbl:
                this._linesSinceChange = 0;
                this._ball.vdelbl(value);
                break;

            case Tia.Registers.cxclr:
                this._linesSinceChange = 0;
                this._collisionMask = 0;
                break;

            case Tia.Registers.audc0:
                this._audio0.audc(value);
                break;

            case Tia.Registers.audc1:
                this._audio1.audc(value);
                break;

            case Tia.Registers.audf0:
                this._audio0.audf(value);
                break;

            case Tia.Registers.audf1:
                this._audio1.audf(value);
                break;

            case Tia.Registers.audv0:
                this._audio0.audv(value);
                break;

            case Tia.Registers.audv1:
                this._audio1.audv(value);
                break;
        }
    }

    getDebugState(): string {
        return '' +
            `hclock: ${this._hctr}   line: ${this._frameManager.getCurrentLine()}\n` +
            this._frameManager.getDebugState();
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }


    cycle(): void {
        this._delayQueue.execute(Tia._delayedWrite, this);

        this._collisionUpdateRequired = false;

        this._tickMovement();

        if (this._hstate === HState.blank) {
            this._tickHblank();
        } else {
            this._tickHframe();
        }

        if (this._collisionUpdateRequired) {
            this._updateCollision();
        }

        if (++this._hctr >= 228) {
            this._nextLine();
        }

        this._clock++;
    }

    private _tickMovement(): void {
        if (!this._movementInProgress) {
            return;
        }

        // color clock mod 4
        if ((this._hctr & 0x3) === 0) {
            // the movement counter dirties the line cache
            this._linesSinceChange = 0;

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
        // we cannot use hblankctr === 0 here because it is not positive definite
        if (this._freshLine) {
            this._hblankCtr = 0;
            this._cpu.resume();
            this._freshLine = false;
        }

        if (++this._hblankCtr >= 68) {
            this._hstate = HState.frame;
        }
    }

    private _tickHframe() {
        const y = this._frameManager.getCurrentLine(),
            lineNotCached = this._linesSinceChange < 2 || y === 0,
            x = this._hctr - 68 + this._xDelta;

        // collision latches must be updated if we cannot use cached line daa
        this._collisionUpdateRequired = lineNotCached;

        // The playfield does not have its own counter and must be cycled before rendering the sprites.
        // We can never cache this as the current pixel register must be up to date if
        // we leave caching mode.
        this._playfield.tick(x);

        // sprites are only rendered if we cannot reuse line data
        if (lineNotCached) {
            this._renderSprites();
        }

        // spin sprite timers
        this._tickSprites();

        // render pixel data
        if (this._frameManager.isRendering()) {
            this._renderPixel(x, y, lineNotCached);
        }
    }

    private _renderSprites() {
        this._player0.render();
        this._player1.render();
        this._missile0.render();
        this._missile1.render();
        this._ball.render();
    }

    private _tickSprites() {
        this._missile0.tick(true);
        this._missile1.tick(true);
        this._player0.tick();
        this._player1.tick();
        this._ball.tick(true);
    }

    private _nextLine() {
        // Reset the counters
        this._hctr = 0;
        this._linesSinceChange++;

        this._hstate = HState.blank;
        this._freshLine = true;
        this._extendedHblank = false;
        this._xDelta = 0;

        this._frameManager.nextLine();
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
        return (config.tvMode === Config.TvMode.ntsc) ?
            60 * 228 * Metrics.frameLinesNTSC :
            50 * 228 * Metrics.frameLinesPAL;
    }

    private _renderPixel(x: number, y: number, lineNotCached: boolean): void {
        if (lineNotCached) {
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

            this._frameManager.surfaceBuffer[y * 160 + x] = this._frameManager.vblank ? 0xFF000000 :color;
        } else {
            this._frameManager.surfaceBuffer[y * 160 + x] = this._frameManager.surfaceBuffer[(y-1) * 160 + x];
        }
    }

    private _updateCollision() {
        this._collisionMask |= (
            ~this._player0.collision &
            ~this._player1.collision &
            ~this._missile0.collision &
            ~this._missile1.collision &
            ~this._ball.collision &
            ~this._playfield.collision
        );
    }

    private _clearHmoveComb(): void {
        if (this._frameManager.isRendering() && this._hstate === HState.blank) {
            const offset = this._frameManager.getCurrentLine() * 160;

            for (let i = 0; i < 8; i++) {
                this._frameManager.surfaceBuffer[offset + i] = 0xFF000000;
            }
        }
    }

    private _resxCounter(): number {
        return this._hstate === HState.blank ?
            (this._hctr >= ResxCounter.lateHblankThreshold ? ResxCounter.lateHblank : ResxCounter.hblank) :
            ResxCounter.frame;
    }

    private _rsync(): void {
        const x = this._hctr > 68 ? this._hctr - 68 : 0;

        this._xDelta = 157 - x;

        if (this._frameManager.isRendering()) {
            const y = this._frameManager.getCurrentLine(),
                base = y * 160 + x,
                boundary = base + (y + 1) * 160;

            for (let i = base; i < boundary; i++) {
                this._frameManager.surfaceBuffer[i] = 0xFF000000;
            }
        }

        this._linesSinceChange = 0;
        this._hctr = 225;
    }

    private static _delayedWrite(address: number, value: number, self: Tia): void {
        switch (address) {
            case Tia.Registers.vblank:
                self._linesSinceChange = 0;
                self._frameManager.setVblank((value & 0x02) > 0);
                break;

            case Tia.Registers.hmove:
                self._linesSinceChange = 0;

                // Start the timer and increase hblank
                self._movementClock = 0;
                self._movementInProgress = true;

                if (!self._extendedHblank) {
                    self._hblankCtr -= 8;
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
                self._linesSinceChange = 0;
                self._playfield.pf0(value);
                break;

            case Tia.Registers.pf1:
                self._linesSinceChange = 0;
                self._playfield.pf1(value);
                break;

            case Tia.Registers.pf2:
                self._linesSinceChange = 0;
                self._playfield.pf2(value);
               break;

            case Tia.Registers.grp0:
                self._linesSinceChange = 0;
                self._player0.grp(value);
                break;

            case Tia.Registers.grp1:
                self._linesSinceChange = 0;
                self._player1.grp(value);
                break;

            case Tia.Registers._shuffleP0:
                self._linesSinceChange = 0;
                self._player0.shufflePatterns();
                break;

            case Tia.Registers._shuffleP1:
                self._linesSinceChange = 0;
                self._player1.shufflePatterns();
                break;

            case Tia.Registers.hmp0:
                self._linesSinceChange = 0;
                self._player0.hmp(value);
                break;

            case Tia.Registers.hmp1:
                self._linesSinceChange = 0;
                self._player1.hmp(value);
                break;

            case Tia.Registers.hmm0:
                self._linesSinceChange = 0;
                self._missile0.hmm(value);
                break;

            case Tia.Registers.hmm1:
                self._linesSinceChange = 0;
                self._missile1.hmm(value);
                break;

            case Tia.Registers.hmbl:
                self._linesSinceChange = 0;
                self._ball.hmbl(value);
                break;

            case Tia.Registers.hmclr:
                self._linesSinceChange = 0;
                self._missile0.hmm(0);
                self._missile1.hmm(0);
                self._player0.hmp(0);
                self._player1.hmp(0);
                self._ball.hmbl(0);
                break;

            case Tia.Registers.refp0:
                self._linesSinceChange = 0;
                self._player0.refp(value);
                break;

            case Tia.Registers.refp1:
                self._linesSinceChange = 0;
                self._player1.refp(value);
                break;

            case Tia.Registers._shuffleBL:
                self._linesSinceChange = 0;
                self._ball.shuffleStatus();
                break;

            case Tia.Registers.enabl:
                self._linesSinceChange = 0;
                self._ball.enabl(value);
                break;

            case Tia.Registers.enam0:
                self._linesSinceChange = 0;
                self._missile0.enam(value);
                break;

            case Tia.Registers.enam1:
                self._linesSinceChange = 0;
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
                buffer[i] = 0xFF000000;
            }
        }

        self.newFrame.dispatch(surface);
    }

    private _cpu: CpuInterface = null;
    private _bus: Bus = null;

    private _frameManager: FrameManager;
    private _delayQueue = new DelayQueue(10, 20);

    private _palette: Uint32Array;

    private _hstate = HState.blank;
    private _freshLine = true;

    // We need a separate counter for the blank period that will be decremented by hmove
    private _hblankCtr = 0;
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

    private _clock = 0.;

    // Lines since the last cache-invalidating change. If this is > 1 we can safely use the linecache
    private _linesSinceChange = 0;

    // Max total lines. Used to clear garbage lines.
    private _maxLinesTotal = 0;

    private _colorBk = 0xFF000000;
    private _priority = Priority.normal;
    // bitfield with collision latches
    private _collisionMask = 0;

    private _player0 =   new Player(CollisionMask.player0);
    private _player1 =   new Player(CollisionMask.player1);
    private _missile0 =  new Missile(CollisionMask.missile0);
    private _missile1 =  new Missile(CollisionMask.missile1);
    private _playfield = new Playfield(CollisionMask.playfield);
    private _ball =      new Ball(CollisionMask.ball);

    private _audio0: Audio;
    private _audio1: Audio;

    private _input0: LatchedInput;
    private _input1: LatchedInput;

    private _paddles: Array<PaddleReader>;

    newFrame = new Event<RGBASurfaceInterface>();

    trap = new Event<Tia.TrapPayload>();
}

module Tia {

    export const enum Registers {
        vsync   = 0x00,
        vblank  = 0x01,
        wsync   = 0x02,
        rsync   = 0x03,
        nusiz0  = 0x04,
        nusiz1  = 0x05,
        colup0  = 0x06,
        colup1  = 0x07,
        colupf  = 0x08,
        colubk  = 0x09,
        ctrlpf  = 0x0A,
        refp0   = 0x0B,
        refp1   = 0x0C,
        pf0     = 0x0D,
        pf1     = 0x0E,
        pf2     = 0x0F,
        resp0   = 0x10,
        resp1   = 0x11,
        resm0   = 0x12,
        resm1   = 0x13,
        resbl   = 0x14,
        audc0   = 0x15,
        audc1   = 0x16,
        audf0   = 0x17,
        audf1   = 0x18,
        audv0   = 0x19,
        audv1   = 0x1A,
        grp0    = 0x1B,
        grp1    = 0x1C,
        enam0   = 0x1D,
        enam1   = 0x1E,
        enabl   = 0x1F,
        hmp0    = 0x20,
        hmp1    = 0x21,
        hmm0    = 0x22,
        hmm1    = 0x23,
        hmbl    = 0x24,
        vdelp0  = 0x25,
        vdelp1  = 0x26,
        vdelbl  = 0x27,
        resmp0  = 0x28,
        resmp1  = 0x29,
        hmove   = 0x2A,
        hmclr   = 0x2B,
        cxclr   = 0x2C,
        cxm0p   = 0x00,
        cxm1p   = 0x01,
        cxp0fb  = 0x02,
        cxp1fb  = 0x03,
        cxm0fb  = 0x04,
        cxm1fb  = 0x05,
        cxblpf  = 0x06,
        cxppmm  = 0x07,
        inpt0   = 0x08,
        inpt1   = 0x09,
        inpt2   = 0x0A,
        inpt3   = 0x0B,
        inpt4   = 0x0C,
        inpt5   = 0x0D,

        // These "registers" are not exposed to the system and only used in delaying
        // internal processes.
        _shuffleP0      = 0xF0,
        _shuffleP1      = 0xF1,
        _shuffleBL      = 0xF2
    }

    export const enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public tia: Tia,
            public message?: string
        ) {}
    }
}

export default Tia;
