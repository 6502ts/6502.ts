enum Encoding {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F};

export function encode(value: number, width?: number): string {
    var result = (value < 0 ? '-' : '') + '$',
        x = Math.abs(Math.floor(value)),
        base = 1;

    if (typeof(width) === 'undefined') {
        while (base * 16 <= x) base *= 16;
    } else {
        for (var i = 1; i < width; i++) base *= 16;
        if (16 * base - 1 < value) throw new TypeError('range exceeded');
    }

    while (base >= 1) {
        result += Encoding[Math.floor(x / base)];
        x %= base;
        base /= 16;
    }

    return result;
}

export function decode(value: string): number {
    var decomposition = value.toUpperCase().match(/^-?\$([\dA-F]+)$/);

    if (!decomposition) throw new TypeError('invalid hex number ' + value);

    var hex = decomposition[1],
        result = 0,
        base = 1;

    for (var i = 0; i < hex.length - 1; i++) base *= 16;

    // We seem to need this in order to trick the type system :(
    var hex2dec = (x: any): number => parseInt(Encoding[x], 10);

    while (hex) {
        result += hex2dec(hex[0]) * base;
        base /= 16;
        hex = hex.substr(1);
    }

    if (value.indexOf('-') >= 0) result *= -1;

    return result;
}
