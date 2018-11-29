import { Mapping, button, Target, axis, Sign } from './Mapping';

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

export const defaultMapping: Array<Mapping> = [
    button(12, Target.up),
    button(13, Target.down),
    button(14, Target.left),
    button(15, Target.right),

    button(8, Target.select),
    button(9, Target.start),

    ...[0, 1, 2, 3, 10, 11].map(i => button(i, Target.fire)),
    ...[4, 5, 6, 7].map(i => button(i, Target.pause)),

    axis(0, Sign.negative, Target.left),
    axis(0, Sign.positive, Target.right),
    axis(1, Sign.negative, Target.up),
    axis(1, Sign.positive, Target.down),

    axis(2, Sign.negative, Target.left),
    axis(2, Sign.positive, Target.right),
    axis(3, Sign.negative, Target.up),
    axis(3, Sign.positive, Target.down)
];

export default defaultMapping;
