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

class Config {
    constructor(
        public tvMode: Config.TvMode = Config.TvMode.ntsc,
        public enableAudio = true,
        public randomSeed = -1,
        public emulatePaddles = true
    ) {}

    public static getClockMhz(config: Config): number {
        switch (config.tvMode) {
            case Config.TvMode.ntsc:
                return 3.579545;

            case Config.TvMode.pal:
            case Config.TvMode.secam:
                return 3.546894;
        }
    }
}

namespace Config {

    export const enum TvMode {ntsc, pal, secam}

}

export default Config;
