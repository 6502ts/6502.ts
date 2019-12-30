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

export interface BufferInterface {
    [index: number]: number;
    length: number;
}

export function searchForSignatures(buffer: BufferInterface, signatures: Array<Array<number>>): Array<number> {
    interface Candidate {
        signature: number;
        nextIndex: number;
    }

    const candidates: Array<Candidate> = [],
        counts = signatures.map((signature: Array<number>) => 0);

    for (let i = 0; i < buffer.length; i++) {
        for (let iCandidate = 0; iCandidate < candidates.length; iCandidate++) {
            const candidate = candidates[iCandidate],
                signature = signatures[candidate.signature];

            if (buffer[i] === signature[candidate.nextIndex]) {
                if (++candidate.nextIndex === signature.length) {
                    counts[candidate.signature]++;
                    candidates.splice(iCandidate, 1);
                    iCandidate--;
                }
            } else {
                candidates.splice(iCandidate, 1);
                iCandidate--;
            }
        }

        for (let iSignature = 0; iSignature < signatures.length; iSignature++) {
            const signature = signatures[iSignature];

            if (signature.length > 0 && buffer[i] === signature[0]) {
                if (signature.length === 1) {
                    counts[iSignature]++;
                } else {
                    candidates.push({
                        signature: iSignature,
                        nextIndex: 1
                    });
                }
            }
        }
    }

    return counts;
}

export function searchForSignature(buffer: BufferInterface, signature: Array<number>): number {
    for (let i = 0; i < buffer.length; i++) {
        let j: number;

        for (j = 0; j < signature.length && (buffer[i + j] === signature[j] || signature[j] < 0); j++) {}

        if (j === signature.length) {
            return i;
        }
    }

    return -1;
}
