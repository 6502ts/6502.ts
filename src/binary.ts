export function encode(value: number, digits?: number): string {
    var result = (value < 0 ? '-' : '') + '0b',
        value = Math.abs(value),
        base = 1;

    if (typeof(digits) === 'undefined') {
        while (2 * base - 1 < value) base *= 2;
    } else {
        for (var i = 1; i < digits; i++) base *= 2;
        if (2 * base - 1 < value) throw new TypeError('range exceeded');
    }

    while (base >= 1) {
        result += Math.floor(value / base);
        value %= base;
        base /= 2;
    }

    return result;
}
