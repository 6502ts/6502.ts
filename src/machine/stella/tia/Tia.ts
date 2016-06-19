import VideoOutputInterface from '../../io/VideoOutputInterface';
import AudioOutputInterface from '../../io/AudioOutputInterface';
import DigitalJoystickInterface from '../../io/DigitalJoystickInterface';
import RGBASurfaceInterface from '../../../tools/surface/RGBASurfaceInterface';
import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import Event from '../../../tools/event/Event';
import Config from '../Config';
import CpuInterface from '../../cpu/CpuInterface';
import Metrics from './Metrics';
import Missile from './Missile';
import Playfield from './Playfield';
import Player from './Player';
import Ball from './Ball';
import LatchedInput from './LatchedInput';
import Audio from './Audio';
import * as palette from './palette';

const VISIBLE_LINES_NTSC = 192,
    VISIBLE_LINES_PAL = 228,
    VBLANK_NTSC = 37,
    VBLANK_PAL = 45;

const enum Count {
    movementCounterOffset = -3
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
const enum Priority {normal, inverted};

class Tia implements VideoOutputInterface, AudioOutputInterface {

    constructor(
        private _config: Config,
        joystick0: DigitalJoystickInterface,
        joystick1: DigitalJoystickInterface
    ) {
        this._metrics = this._getMetrics(this._config);
        this._palette = this._getPalette(this._config);
        this._input0 = new LatchedInput(joystick0.getFire());
        this._input1 = new LatchedInput(joystick1.getFire());

        this._player0.patternChange.addHandler(() => this._player1.shufflePatterns());
        this._player1.patternChange.addHandler(() => {
            this._player0.shufflePatterns();
            this._ball.shuffleStatus();
        });

        this.reset();
    }

    reset(): void {
        this._hblankCtr = 0;
        this._hctr = 0;
        this._vctr = 0;
        this._movementInProgress = false;
        this._extendedHblank = false;
        this._movementCtr = 0;
        this._vsync = false;
        this._frameInProgress = false;
        this._priority = Priority.normal;
        this._hstate = HState.blank;
        this._freshLine = true;
        this._collisionMask = 0;
        this._vblank = false;
        this._colorBk = 0xFF000000;

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

        if (this._cpu) {
            this._cpu.resume();
        }

        this._finalizeFrame();
    }

    setCpu(cpu: CpuInterface): Tia {
        this._cpu = cpu;

        return this;
    }

    getWidth(): number {
        return 160;
    }

    getHeight(): number {
        return this._metrics.visibleLines;
    }

    setSurfaceFactory(factory: VideoOutputInterface.SurfaceFactoryInterface): Tia {
        this._surfaceFactory = factory;

        return this;
    }

    newFrame = new Event<RGBASurfaceInterface>();

    changedBuffer = new Event<AudioOutputBuffer>();

    cycle(): void {
        this._tickMovement();
        this._playfield.tick();
        this._tickHclock();
    }

    private _tickMovement(): void {
        if (this._movementInProgress) {
            // The actual clock supplied to the sprites is mod 4
            if (this._movementCtr >= 0 && (this._movementCtr & 0x3) === 0) {
                // The tick is only propagated to the sprite counters if we are in blank
                // mode --- in frame mode, it overlaps with the sprite clock and is gobbled
                const apply = this._hstate === HState.blank,
                    clock = this._movementCtr >>> 2;

                let m = false;

                m = this._missile0.movementTick(clock, apply) || m;
                m = this._missile1.movementTick(clock, apply) || m;
                m = this._player0.movementTick(clock, apply) || m;
                m = this._player1.movementTick(clock, apply) || m;
                m = this._ball.movementTick(clock, apply) || m;

                this._movementInProgress = m;
            }

            this._movementCtr++;
        }
    }

    private _tickHclock(): void {
        switch (this._hstate) {
            case HState.blank:
                if (this._freshLine) {
                    this._hblankCtr = 0;
                    this._cpu.resume();
                    this._freshLine = false;
                }

                if (++this._hblankCtr >= 68) {
                    this._hstate = HState.frame;
                }

                this._hctr++;

                break;

            case HState.frame:
                // Order matters: sprites determine whether they should start drawing during tick and
                // draw the first pixel during the next frame
                if (this._frameInProgress && this._vctr >= this._metrics.vblank) {
                    this._renderPixel(this._hctr - 68, this._vctr - this._metrics.vblank);
                }

                // Spin the sprite timers
                this._missile0.tick();
                this._missile1.tick();
                this._player0.tick();
                this._player1.tick();
                this._ball.tick();

                if (++this._hctr >= 228) {
                    // Reset the counters
                    this._hctr = 0;
                    this._vctr++;

                    if (this._frameInProgress) {
                        // Overscan reached? -> pump out frame
                        if (this._vctr >= this._metrics.overscanStart){
                            this._finalizeFrame();
                        }
                    }

                    this._hstate = HState.blank;
                    this._freshLine = true;
                    this._extendedHblank = false;
                }

                break;
        }
    }

    read(address: number): number {
        // Only keep the lowest four bits
        switch (address & 0x0F) {
            case Tia.Registers.inpt4:
                return this._input0.inpt();

            case Tia.Registers.inpt5:
                return this._input1.inpt();

            case Tia.Registers.cxm0p:
                return (
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.player0) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.player1) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxm1p:
                return (
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.player1) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.player0) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxp0fb:
                return (
                    ((this._collisionMask & CollisionMask.player0 & CollisionMask.ball) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.player0 & CollisionMask.playfield) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxp1fb:
                return (
                    ((this._collisionMask & CollisionMask.player1 & CollisionMask.ball) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.player1 & CollisionMask.playfield) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxm0fb:
                return (
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.ball) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.playfield) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxm1fb:
                return (
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.ball) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.missile1 & CollisionMask.playfield) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxppmm:
                return (
                    ((this._collisionMask & CollisionMask.missile0 & CollisionMask.missile1) > 0 ? 0x40 : 0) |
                    ((this._collisionMask & CollisionMask.player0 & CollisionMask.player1) > 0 ? 0x80 : 0)
                );

            case Tia.Registers.cxblpf:
                return (this._collisionMask & CollisionMask.ball & CollisionMask.playfield) > 0 ? 0x80 : 0;

        }

        return 0;
    }

    write(address: number, value: number): void {
        let v = 0;

        // Mask out A6 - A15
        switch (address & 0x3F) {
            case Tia.Registers.wsync:
                this._cpu.halt();
                break;

            case Tia.Registers.vsync:
                if ((value & 2) > 0 && !this._vsync) {
                    this._vsync = true;
                    this._finalizeFrame();
                } else if (this._vsync) {
                    this._vsync = false;
                    this._startFrame();
                }

                break;

            case Tia.Registers.vblank:
                this._input0.vblank(value);
                this._input1.vblank(value);
                this._vblank = (value & 0x02) > 0;
                break;

            case Tia.Registers.enam0:
                this._missile0.enam(value);
                break;

            case Tia.Registers.enam1:
                this._missile1.enam(value);
                break;

            case Tia.Registers.hmm0:
                this._missile0.hmm(value);
                break;

            case Tia.Registers.hmm1:
                this._missile1.hmm(value);
                break;

            case Tia.Registers.resm0:
                this._missile0.resm();
                break;

            case Tia.Registers.resm1:
                this._missile1.resm();
                break;

            case Tia.Registers.hmclr:
                this._missile0.hmm(0);
                this._missile1.hmm(0);
                this._player0.hmp(0);
                this._player1.hmp(0);
                this._ball.hmbl(0);
                break;

            case Tia.Registers.nusiz0:
                this._missile0.nusiz(value);
                this._player0.nusiz(value);
                break;

            case Tia.Registers.nusiz1:
                this._missile1.nusiz(value);
                this._player1.nusiz(value);
                break;

            case Tia.Registers.hmove:
                // Start the timer and increase hblank
                this._movementCtr = Count.movementCounterOffset;
                this._movementInProgress = true;

                if (!this._extendedHblank) {
                    this._hblankCtr -= 8;
                    this._clearHmoveComb();
                    this._extendedHblank = true;
                }

                // Start sprite movement
                this._missile0.startMovement();
                this._missile1.startMovement();
                this._player0.startMovement();
                this._player1.startMovement();
                this._ball.startMovement();

                break;

            case Tia.Registers.colubk:
                this._colorBk = this._palette[(value & 0xFF) >>> 1];
                break;

            case Tia.Registers.colup0:
                v = this._palette[(value & 0xFF) >>> 1];
                this._missile0.color = v;
                this._player0.color = v;
                this._playfield.setColorP0(v);

                break;

            case Tia.Registers.colup1:
                v = this._palette[(value & 0xFF) >>> 1];
                this._missile1.color = v;
                this._player1.color = v;
                this._playfield.setColorP1(v);

                break;

            case Tia.Registers.pf0:
                this._playfield.pf0(value);
                break;

            case Tia.Registers.pf1:
                this._playfield.pf1(value);
                break;

            case Tia.Registers.pf2:
                this._playfield.pf2(value);
                break;

            case Tia.Registers.ctrlpf:
                this._priority = (value & 0x04) ? Priority.inverted : Priority.normal;
                this._playfield.ctrlpf(value);
                this._ball.ctrlpf(value);
                break;

            case Tia.Registers.colupf:
                v = this._palette[(value & 0xFF) >>> 1];
                this._playfield.setColor(v);
                this._ball.color = v;
                break;

            case Tia.Registers.grp0:
                this._player0.grp(value);
                break;

            case Tia.Registers.grp1:
                this._player1.grp(value);
                break;

            case Tia.Registers.resp0:
                this._player0.resp();
                break;

            case Tia.Registers.resp1:
                this._player1.resp();
                break;

            case Tia.Registers.refp0:
                this._player0.refp(value);
                break;

            case Tia.Registers.refp1:
                this._player1.refp(value);
                break;

            case Tia.Registers.hmp0:
                this._player0.hmp(value);
                break;

            case Tia.Registers.hmp1:
                this._player1.hmp(value);
                break;

            case Tia.Registers.vdelp0:
                this._player0.vdelp(value);
                break;

            case Tia.Registers.vdelp1:
                this._player1.vdelp(value);
                break;

            case Tia.Registers.enabl:
                this._ball.enabl(value);
                break;

            case Tia.Registers.hmbl:
                this._ball.hmbl(value);
                break;

            case Tia.Registers.resbl:
                this._ball.resbl();
                break;

            case Tia.Registers.vdelbl:
                this._ball.vdelbl(value);
                break;

            case Tia.Registers.cxclr:
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
            `hclock: ${this._hctr}   vclock: ${this._vctr}    vsync: ${this._vsync ? 1 : 0}    frame pending: ${this._frameInProgress ? "yes" : "no"}`;
    }

    trap = new Event<Tia.TrapPayload>();

    private _getMetrics(config: Config): Metrics {
        switch (this._config.tvMode) {
            case Config.TvMode.secam:
            case Config.TvMode.pal:
                return new Metrics(VISIBLE_LINES_PAL, VBLANK_PAL);

            case Config.TvMode.ntsc:
                return new Metrics(VISIBLE_LINES_NTSC, VBLANK_NTSC);

            default:
                throw new Error('invalid TV mode');
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

    private _finalizeFrame(): void {
        if (this._frameInProgress) {
            if (this._surface) {
                this._clearHmoveComb();
                this.newFrame.dispatch(this._surface);
                this._surface = null;
                this._surfaceBuffer = null;
            }

            this._frameInProgress = false;
        }
    }

    private _startFrame(): void {
        if (this._surfaceFactory) {
            this._surface = this._surfaceFactory();
            this._surfaceBuffer = this._surface.getBuffer();
        }

        this._frameInProgress = true;
        this._vctr = 0;
    }

    private _renderPixel(x: number, y: number): void {
        let color = this._colorBk;

        switch (this._priority) {
            case Priority.normal:
                color = this._playfield.renderPixel(x, color);
                color = this._ball.renderPixel(color);
                color = this._missile1.renderPixel(color);
                color = this._player1.renderPixel(color);
                color = this._missile0.renderPixel(color);
                color = this._player0.renderPixel(color);
                break;

            case Priority.inverted:
                color = this._ball.renderPixel(color);
                color = this._missile1.renderPixel(color);
                color = this._player1.renderPixel(color);
                color = this._missile0.renderPixel(color);
                color = this._player0.renderPixel(color);
                color = this._playfield.renderPixel(x, color);
                break;
        }

        this._collisionMask |= (
            (this._player0.collision & this._player1.collision)     |
            (this._player0.collision & this._missile0.collision)    |
            (this._player0.collision & this._missile1.collision)    |
            (this._player0.collision & this._ball.collision)        |
            (this._player0.collision & this._playfield.collision)   |
            (this._player1.collision & this._missile0.collision)    |
            (this._player1.collision & this._missile1.collision)    |
            (this._player1.collision & this._ball.collision)        |
            (this._player1.collision & this._playfield.collision)   |
            (this._missile0.collision & this._missile1.collision)   |
            (this._missile0.collision & this._ball.collision)       |
            (this._missile0.collision & this._playfield.collision)  |
            (this._missile1.collision & this._ball.collision)       |
            (this._missile1.collision & this._playfield.collision)  |
            (this._ball.collision & this._playfield.collision)
        );

        if (this._surface) {
            this._surfaceBuffer[y * 160 + x] = this._vblank ? 0xFF000000 : color;
        }
    }

    private _clearHmoveComb(): void {
        if (this._surface && this._frameInProgress && this._hstate === HState.blank) {
            const buffer = this._surface.getBuffer(),
                offset = (this._vctr - this._metrics.vblank) * 160;

            for (let i = 0; i < 8; i++) {
                buffer[offset + i] = 0xFF000000;
            }
        }
    }


    private _surfaceFactory: VideoOutputInterface.SurfaceFactoryInterface;
    private _surface: RGBASurfaceInterface = null;
    private _surfaceBuffer: RGBASurfaceInterface.BufferInterface;

    private _cpu: CpuInterface;

    private _palette: Uint32Array;

    private _metrics: Metrics;

    private _hstate = HState.blank;
    private _freshLine = true;

    // We need a separate counter for the blank period that will be decremented by hmove
    private _hblankCtr = 0;

    // Line and row counters
    private _hctr = 0;
    private _vctr = 0;

    // Count the extra clocks triggered by move
    private _movementCtr = 0;
    // Is the movement clock active and shoud pulse?
    private _movementInProgress = false;
    //
    private _extendedHblank = false;

    private _frameInProgress = false;
    private _vsync = false;
    private _vblank = false;

    private _colorBk = 0xFF000000;
    private _priority = Priority.normal;
    private _collisionMask = 0;

    private _player0 =   new Player(CollisionMask.player0);
    private _player1 =   new Player(CollisionMask.player1);
    private _missile0 =  new Missile(CollisionMask.missile0);
    private _missile1 =  new Missile(CollisionMask.missile1);
    private _playfield = new Playfield(CollisionMask.playfield);
    private _ball =      new Ball(CollisionMask.ball);

    private _audio0 = new Audio();
    private _audio1 = new Audio();

    private _input0: LatchedInput;
    private _input1: LatchedInput;
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
        enabl  = 0x1F,
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
        inpt5   = 0x0D
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
