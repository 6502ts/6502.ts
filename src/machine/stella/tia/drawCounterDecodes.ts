const
    decodes0 = new Uint8Array(160),
    decodes1 = new Uint8Array(160),
    decodes2 = new Uint8Array(160),
    decodes3 = new Uint8Array(160),
    decodes4 = new Uint8Array(160),
    decodes6 = new Uint8Array(160);

export const decodes: Array<Uint8Array> = [
    decodes0,
    decodes1,
    decodes2,
    decodes3,
    decodes4,
    decodes0,
    decodes6,
    decodes0
];

module init {
    [
        decodes0,
        decodes1,
        decodes2,
        decodes3,
        decodes4,
        decodes6
    ].forEach(decodes => {
        for (let i = 0; i < 160; i++) {
            decodes[i] = 0;
        }

        decodes[156] = 1;
    });

    decodes1[12] = 1;
    decodes2[28] = 1;
    decodes3[12] = decodes3[28] = 1;
    decodes4[60] = 1;
    decodes6[28] = decodes6[60] = 1;
}
