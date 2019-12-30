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

import assert from 'assert';

import { createRng, restoreRng } from '../../../src/tools/rng/factory';

import GeneratorInterface from '../../../src/tools/rng/GeneratorInterface';

function sequence(length: number, generator: GeneratorInterface): Array<number> {
    const result = new Array<number>(length);

    for (let i = 0; i < length; i++) {
        result[i] = generator.int32();
    }

    return result;
}

suite('Random Nuber Generator', function() {
    test('identical seeds produce identical sequences', function() {
        const rng1 = createRng(1),
            rng2 = createRng(1),
            sequence1 = sequence(100, rng1),
            sequence2 = sequence(100, rng2);

        assert.deepEqual(sequence1, sequence2);
    });

    test('different seeds produce identical sequences', function() {
        const rng1 = createRng(1),
            rng2 = createRng(2),
            sequence1 = sequence(100, rng1),
            sequence2 = sequence(100, rng2);

        assert.notDeepEqual(sequence1, sequence2);
    });

    test('range limits are honored', function() {
        const rng = createRng(1),
            counts = new Array<number>(10);

        for (let i = 0; i < counts.length; i++) {
            counts[i] = 0;
        }

        for (let i = 0; i < 10000; i++) {
            counts[rng.int(9)]++;
        }

        assert(Math.min(...counts) > 0);
        assert.strictEqual(counts.reduce((acc, x) => acc + x, 0), 10000);
    });

    test('restored state yields the same sequence', function() {
        const rng1 = createRng(1);

        for (let i = 0; i < 10000; i++) {
            rng1.int32();
        }

        const rng2 = restoreRng(rng1.saveState()),
            seq1 = sequence(100, rng1),
            seq2 = sequence(100, rng2);

        assert.deepEqual(seq1, seq2);
    });
});
