'use strict';

var encodingsString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    encodings = new Uint8Array(256);

(function() {
    var i: number;

    for (i = 0; i < 256; i++) encodings[i] = 255;
    for (i = 0; i < 64; i++)
        encodings[encodingsString.charCodeAt(i)] = i;

    encodings['='.charCodeAt(0)] = 0;
})();

function decodeChar(data: string, idx: number): number {
    var value = encodings[data.charCodeAt(idx)];

    if (value > 63) throw new Error(
        'invalid base64 character "' + data[idx] + '" at index ' + idx);

    return value;
}

function decodeNibble(data: string, idx: number): number {
    return  (decodeChar(data, idx)   << 18)+
            (decodeChar(data, idx+1) << 12) +
            (decodeChar(data, idx+2) << 6) +
             decodeChar(data, idx+3);
}

function getPadding(data: string): number {
    var padding = 0,
        idx = data.length - 1;

    while (idx >= 0 && data[idx--] === '=') padding++;

    return padding;
}

export function decode(data: string): Uint8Array {
    if (data.length % 4 !== 0) throw new Error(
        'invalid base64 data --- char count mismatch');

    var nibbles = data.length / 4,
        decodedSize = nibbles * 3 - getPadding(data),
        decoded = new Uint8Array(decodedSize),
        idx = 0;

    for (var i = 0; i < nibbles; i++) {
        var nibble = decodeNibble(data, i * 4);

        for (var j = 0; j < 3 && idx < decodedSize; j++)
            decoded[idx++] = (nibble >>> (8 * (2-j))) & 0xFF;
    }

    return decoded;
}
