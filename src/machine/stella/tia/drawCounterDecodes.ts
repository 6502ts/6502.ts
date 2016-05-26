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

        decodes[159] = 1;
    });

    decodes1[15] = 1;
    decodes2[31] = 1;
    decodes3[15] = decodes3[31] = 1;
    decodes4[63] = 1;
    decodes6[31] = decodes6[63] = 1;
}
