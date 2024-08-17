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

import CartridgeF8 from './CartridgeF8';
import CartridgeE0 from './CartridgeE0';
import Cartridge3F from './Cartridge3F';
import Cartridge3E from './Cartridge3E';
import CartridgeFE from './CartridgeFE';
import CartridgeUA from './CartridgeUA';
import CartridgeE7 from './CartridgeE7';
import CartridgeFA2 from './CartridgeFA2';
import CartridgeEF from './CartridgeEF';
import CartridgeDPCPlus from './CartridgeDPCPlus';
import CartridgeCDF from './CartridgeCDF';
import Cartridge8040 from './Cartridge0840';
import * as cartridgeUtil from './util';
import CartridgeCV from './CartridgeCV';
import { CartridgeType } from './CartridgeInfo';

class CartridgeDetector {
    detectCartridgeType(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        if (buffer.length % 8448 === 0) {
            return CartridgeType.bankswitch_supercharger;
        }

        if (buffer.length < 0x0800) {
            return CartridgeType.vanilla_2k;
        }

        if (buffer.length >= 10240 && buffer.length <= 10496) {
            return CartridgeType.bankswitch_8k_DPC;
        }

        switch (buffer.length) {
            case 0x0800:
                return this._detect2k(buffer);

            case 0x1000:
                return CartridgeType.vanilla_4k;

            case 0x2000:
                return this._detect8k(buffer);

            case 0x2003:
                return CartridgeType.bankswitch_8k_pp;

            case 0x3000:
                return CartridgeType.bankswitch_12k_FA;

            case 0x4000:
                return this._detect16k(buffer);

            case 0x7000:
                return CartridgeType.bankswitch_FA2;

            case 0x7400:
                return this._detect29k(buffer);

            case 0x8000:
                return this._detect32k(buffer);

            case 0x10000:
                return this._detect64k(buffer);

            default:
                return CartridgeType.unknown;
        }
    }

    private _detect2k(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        if (CartridgeCV.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_2k_cv;
        }

        return CartridgeType.vanilla_2k;
    }

    private _detect8k(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        const f8Matches = CartridgeF8.matchesBuffer(buffer);

        if (CartridgeE0.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_8k_E0;
        }

        if (Cartridge3F.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_8k_3F;
        }

        if (CartridgeUA.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_8k_UA;
        }

        if (!f8Matches && CartridgeFE.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_8k_FE;
        }

        if (Cartridge8040.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_8k_econobanking;
        }

        return CartridgeType.bankswitch_8k_F8;
    }

    private _detect16k(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        if (CartridgeE7.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_16k_E7;
        }

        return CartridgeType.bankswitch_16k_F6;
    }

    private _detect29k(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        if (CartridgeFA2.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_FA2;
        }

        return CartridgeType.bankswitch_dpc_plus;
    }

    private _detect32k(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        if (Cartridge3E.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_3E;
        }

        if (CartridgeDPCPlus.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_dpc_plus;
        }

        if (CartridgeCDF.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_cdf;
        }

        return CartridgeType.bankswitch_32k_F4;
    }

    private _detect64k(buffer: cartridgeUtil.BufferInterface): CartridgeType {
        if (CartridgeEF.matchesBuffer(buffer)) {
            return CartridgeType.bankswitch_64k_EF;
        }

        return CartridgeType.bankswitch_64k_F0;
    }
}

export { CartridgeDetector as default };
