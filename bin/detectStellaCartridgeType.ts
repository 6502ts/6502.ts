/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import * as fs from 'fs';
import Detector from '../src/machine/stella/cartridge/CartridgeDetector';
import CartridgeInfo from '../src/machine/stella/cartridge/CartridgeInfo';

function usage(): void {
    console.log(`detectStellaCartridgeType.js <cartridge file>`);
    process.exit(1);
}

if (process.argv.length <= 2) {
    usage();
}

try {
    const buffer = fs.readFileSync(process.argv[2]),
        detector = new Detector(),
        cartridgeType = detector.detectCartridgeType(buffer);

    console.log(CartridgeInfo.describeCartridgeType(cartridgeType));
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
