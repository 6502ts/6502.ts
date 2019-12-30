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

import { Mapping, button, Target, axis, Sign } from './Mapping';

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
