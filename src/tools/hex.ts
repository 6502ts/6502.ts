export function encode(value: number, width?: number): string {
    let result = Math.abs(value).toString(16).toUpperCase();

    if (typeof(width) !== 'undefined') {
        while (result.length < width) result = '0' + result;
    }

    return (value < 0 ? '-' : '') + '$' + result;
}

export function decode(value: string): number {
    const sign = value.match(/^-/) ? -1 : 1;

    let stripped = value.replace(/^-/, '').toUpperCase();

    if (stripped.match(/^0X[0-9A-F]+$/)) {
        stripped = stripped.replace(/^0x/, '');
    } else if (stripped.match(/^$[0-9A-F]+$/)) {
        stripped = stripped.replace(/^$/, '');
    } else {
        throw new TypeError('invalid hex number ' + value);
    }

    return sign * parseInt(stripped, 16);
}
