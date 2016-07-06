export interface BufferInterface {
    [index: number]: number;
    length: number;
}

export function searchForSignatures(
    buffer: BufferInterface,
    signatures: Array<Array<number>>
) : Array<number> {

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
