/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

export const enum Target {
    left = 'left',
    right = 'right',
    up = 'up',
    down = 'down',
    fire = 'fire',
    start = 'start',
    select = 'select',
    pause = 'pause'
}

export const enum MappingType {
    button = 'button',
    axis = 'axis'
}

export const enum Sign {
    positive = 'positive',
    negative = 'negative'
}

export interface ButtonMapping {
    type: MappingType.button;

    index: number;
    target: Target;
}

export interface AxisMapping {
    type: MappingType.axis;

    index: number;
    sign: Sign;
    target: Target;
}

export type Mapping = ButtonMapping | AxisMapping;

export function button(index: number, target: Target): ButtonMapping {
    return {
        type: MappingType.button,
        index,
        target
    };
}

export function axis(index: number, sign: Sign, target: Target): AxisMapping {
    return {
        type: MappingType.axis,
        index,
        sign,
        target
    };
}

export default Mapping;
