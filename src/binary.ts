'use strict';

export function encode(value: number, width?: number): string {
    var result = Math.abs(value).toString(2);

    if (typeof(width) !== 'undefined') {
        while (result.length < width) result = '0' + result;
    }

    return (value < 0 ? '-' : '') + '0b' + result;
}
