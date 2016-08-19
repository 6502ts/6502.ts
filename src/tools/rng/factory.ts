import * as seedrandom from 'seedrandom';

import GeneratorInterface from './GeneratorInterface';
import SeedrandomGenerator from './SeedrandomGenerator';

export function createRng(seed: number): GeneratorInterface {
    if (seed < 0) {
        seed = Math.random();
    }

    return new SeedrandomGenerator(
        seedrandom.alea(seed as any, {
            state: true
        })
    );
}

export function restoreRng(state: any): GeneratorInterface {
    return new SeedrandomGenerator(
        seedrandom.alea('', {
            state
        })
    );
}