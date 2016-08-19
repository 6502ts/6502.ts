import * as assert from 'assert';

import {
    createRng,
    restoreRng
} from '../../src/tools/rng/factory';

import GeneratorInterface from '../../src/tools/rng/GeneratorInterface';

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