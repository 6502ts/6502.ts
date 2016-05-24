import VideoOutputInterface from '../../io/VideoOutputInterface';
import RGBASurfaceInterface from '../../../tools/surface/RGBASurfaceInterface';
import Event from '../../../tools/event/Event';
import Config from '../Config';
import CpuInterface from '../../cpu/CpuInterface';
import Metrics from './Metrics';
import Missile from './Missile';
import * as palette from './palette';

const VISIBLE_WIDTH = 160,
    TOTAL_WIDTH = 228,
    VISIBLE_LINES_NTSC = 192,
    VISIBLE_LINES_PAL = 228,
    VBLANK_NTSC = 40,
    VBLANK_PAL = 48,
    OVERSCAN_NTSC = 30,
    OVERSCAN_PAL = 36;

const enum HState {blank, frame};

class Tia implements VideoOutputInterface {

    constructor(
        private _config: Config
    ) {
        this._metrics = this._getMetrics(this._config);
        this._palette = this._getPalette(this._config);

        this._missile0 = new Missile(this._metrics);
        this._missile1 = new Missile(this._metrics);

        this.reset();
    }

    reset(): void {
        this._hblankCtr = this._hctr = this._vctr = 0;
        this._movementInProgress = false;
        this._movementCtr = 0;
        this._vsync = this._frameInProgress = false;

        this._missile0.reset();
        this._missile1.reset();

        if (this._cpu) {
            this._cpu.resume();
        }
    }

    setCpu(cpu: CpuInterface): Tia {
        this._cpu = cpu;

        return this;
    }

    getWidth(): number {
        return this._metrics.visibleWidth;
    }

    getHeight(): number {
        return this._metrics.visibleLines;
    }

    setSurfaceFactory(factory: VideoOutputInterface.SurfaceFactoryInterface): Tia {
        this._surfaceFactory = factory;

        return this;
    }

    newFrame = new Event<RGBASurfaceInterface>();

    cycle(): void {
        switch (this._hstate) {
            case HState.blank:
                // Fire the movement clock if applicable
                this._movementTick();

                if (++this._hblankCtr >= this._metrics.hblank) {
                    this._hstate = HState.frame;
                }

                this._hctr++;

                break;

            case HState.frame:
                // Order matters: Sprites enter rendering state when their counters reset and render
                // their first pixrl in the NEXT clock cycle
                if (this._frameInProgress && this._vctr >= this._metrics.vblank) {
                    this._renderPixel(this._hctr - this._metrics.hblank, this._vctr - this._metrics.vblank);
                }

                // Spin the sprite timers
                this._missile0.tick();
                this._missile1.tick();

                if (++this._hctr >= this._metrics.totalWidth) {
                    this._hstate = HState.blank;
                    this._hblankCtr = 0;

                    this._nextLine();
                }
        }
    }

    private _movementTick() {
        if (this._movementInProgress) {

            // The actual clock supplied to the sprites is mod 4
            const clock = this._movementCtr >>> 2;

            if ((this._movementCtr & 0x3) === 0) {
                const m0 = this._missile0.movementTick(clock),
                    m1 = this._missile1.movementTick(clock);

                // Stop timer if all sprites signal "movement finished"
                this._movementInProgress = m0 || m1;
            }

            this._movementCtr++;
        }
    }

    private _nextLine() {
        // Resume the CPU if it was halted
        this._cpu.resume();

        // Reset the counters
        this._hctr = 0;
        this._vctr++;

        // Reset sprite state
        this._missile0.newLine();
        this._missile1.newLine();

        if (this._frameInProgress) {
            // Overscan reached? -> pump out frame
            if (this._vctr >= this._metrics.overscanStart){
                this._finalizeFrame();
            }
        }
    }


    read(address: number): number {
        return 0;
    }

    write(address: number, value: number): void {
        // Mask out A6 - A15
        address &= 0x3F;

        switch (address) {
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

            case Tia.Registers.enam0:
                this._missile0.enam(value);
                break;

            case Tia.Registers.enam1:
                this._missile1.enam(value);
                break;

            case Tia.Registers.hmm0:
                this._missile0.hmm(value);
                break;

            case Tia.Registers.hmm0:
                this._missile1.hmm(value);
                break;

            case Tia.Registers.hmove:
                // Start the timer and increase hblank
                this._movementCtr = 0;
                this._movementInProgress = true;
                this._hblankCtr -= 8;

                // Start sprite movement
                this._missile0.startMovement();
                this._missile1.startMovement();

                break;

            case Tia.Registers.colubk:
                this._colorBk = this._palette[(value & 0xFF) >>> 1];
                break;

            case Tia.Registers.colup0:
                this._missile0.color = this._palette[(value & 0xFF) >>> 1];
                break;

            case Tia.Registers.colup1:
                this._missile1.color = this._palette[(value & 0xFF) >>> 1];
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
                return new Metrics(VISIBLE_WIDTH, TOTAL_WIDTH, VISIBLE_LINES_PAL, VBLANK_PAL);

            case Config.TvMode.ntsc:
                return new Metrics(VISIBLE_WIDTH, TOTAL_WIDTH, VISIBLE_LINES_NTSC, VBLANK_NTSC);

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
                this.newFrame.dispatch(this._surface);
                this._surface = null;
            }

            this._frameInProgress = false;
        }
    }

    private _startFrame(): void {
        if (this._surfaceFactory) {
            this._surface = this._surfaceFactory();
        }

        this._frameInProgress = true;
        this._vctr = 0;
    }

    private _renderPixel(x: number, y: number): void {
        if (!this._surface) {
            return;
        }

        let color = this._colorBk;
        color = this._missile1.renderPixel(x, y, color);
        color = this._missile0.renderPixel(x, y, color);

        this._surface.getBuffer()[y * this._metrics.visibleWidth + x] = color;
    }

    private _surfaceFactory: VideoOutputInterface.SurfaceFactoryInterface;
    private _surface: RGBASurfaceInterface = null;

    private _cpu: CpuInterface;

    private _palette: Uint32Array;

    private _metrics: Metrics;

    private _hstate = HState.blank;

    // We need a separate counter for the blank period that will be decremented by hmove
    private _hblankCtr = 0;

    // Line and row counters
    private _hctr = 0;
    private _vctr = 0;

    // Count the extra clocks triggered by move
    private _movementCtr = 0;
    // Is the movement clock active and shoud pulse?
    private _movementInProgress = false;

    private _frameInProgress = false;
    private _vsync = false;

    private _colorBk = 0xFF000000;

    private _missile0: Missile;
    private _missile1: Missile;
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
        resp1   = 0x10,
        resp2   = 0x11,
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
        enambl  = 0x1F,
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
        cxm0p   = 0x30,
        cxm1p   = 0x31,
        cxp0fb  = 0x32,
        cxp1fb  = 0x33,
        cxm0fb  = 0x34,
        cxm1fb  = 0x35,
        cxblpf  = 0x36,
        cxppmm  = 0x37,
        inpt0   = 0x38,
        inpt1   = 0x39,
        inpt2   = 0x3A,
        inpt3   = 0x3B,
        inpt4   = 0x3C,
        inpt5   = 0x3D
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
