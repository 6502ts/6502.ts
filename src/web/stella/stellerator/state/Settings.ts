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

export default class Settings implements Changeset {

    constructor(changes?: Changeset, old?: Settings) {
        Object.assign(this, old, changes);

        if (this.gamma < 0.1) {
            this.gamma = 0.1;
        }

        if (this.gamma > 5) {
            this.gamma = 5;
        }
    }

    smoothScaling = true;
    webGlRendering = true;
    gamma = 1;
    useWorker = true;
}

interface Changeset {
    smoothScaling?: boolean;
    webGlRendering?: boolean;
    gamma?: number;
    useWorker?: boolean;
}
