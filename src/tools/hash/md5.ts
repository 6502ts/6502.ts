import md5sum = require('md5');

export function calculateFromUint8Array(buffer: Uint8Array): string {
    return md5sum(new Buffer(buffer));
}
