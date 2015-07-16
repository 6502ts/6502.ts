'use strict';

import VideoOutputInterface = require('../io/VideoOutputInterface');
import RGBASurfaceInterface = require('../../tools/surface/RGBASurfaceInterface');
import Event = require('../../tools/event/Event');
import Config = require('./Config');
import CpuInterface = require('../cpu/CpuInterface');

var VISIBLE_WIDTH = 160,
    VISIBLE_LINES_NTSC = 192,
    VISIBLE_LINES_PAL = 228;

class Tia implements VideoOutputInterface {

    constructor(
        private _config: Config,
        private _cpu: CpuInterface
    ) {}

    getWidth(): number {
        return VISIBLE_WIDTH;
    }

    getHeight(): number {
        switch (this._config.tvMode) {
            case Config.TvMode.ntsc:
                return VISIBLE_LINES_NTSC;

            case Config.TvMode.pal:
            case Config.TvMode.secam:
                return VISIBLE_LINES_PAL;

            default:
                throw new Error("invalid TV mode");
        }
    }

    setSurfaceFactory(factory: VideoOutputInterface.SurfaceFactoryInterface): Tia {
        this._surfaceFactory = factory;

        return this;
    }

    newFrame = new Event<RGBASurfaceInterface>();

    tick(): void {}

    read(address: number): number {
        return 0;
    }

    write(address: number, value: number): void {
    }

    trap = new Event<Tia.TrapPayload>();

    private _surfaceFactory: VideoOutputInterface.SurfaceFactoryInterface;
}

module Tia {
    
    export enum Registers {
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

    export enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public tia: Tia,
            public message?: string
        ) {}
    }

}

export = Tia;
