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
