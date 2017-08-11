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

interface Settings {
    smoothScaling: boolean;
    webGlRendering: boolean;
    gamma: number;
    useWorker: boolean;
    mergeFrames: boolean;
    volume: number;
    syncRendering: boolean;
}

namespace Settings {

    export const MAX_GAMMA = 5;
    export const MIN_GAMMA = 0.1;

    export function create(): Settings {
        return {
            smoothScaling: true,
            webGlRendering: true,
            gamma: 1,
            useWorker: true,
            mergeFrames: false,
            volume: 1,
            syncRendering: true
        };
    }

    export function clampGamma(settings: Settings): Settings {
        if (settings.gamma < MIN_GAMMA)  {
            settings.gamma = MIN_GAMMA;
        }

        if (settings.gamma > MAX_GAMMA) {
            settings.gamma = MAX_GAMMA;
        }

        return settings;
    }

}

export default Settings;
