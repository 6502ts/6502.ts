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

import Cartridge2k from './Cartridge2k';
import Cartridge4k from './Cartridge4k';
import CartridgeCV from './CartridgeCV';
import CartridgeF8 from './CartridgeF8';
import CartridgeF6 from './CartridgeF6';
import CartridgeE0 from './CartridgeE0';
import CartridgeFE from './CartridgeFE';
import Cartridge3F from './Cartridge3F';
import Cartridge3E from './Cartridge3E';
import CartridgeUA from './CartridgeUA';
import CartridgeFA from './CartridgeFA';
import CartridgeE7 from './CartridgeE7';
import CartridgeF0 from './CartridgeF0';
import CartridgeEF from './CartridgeEF';
import CartridgeF4 from './CartridgeF4';
import CartridgeFA2 from './CartridgeFA2';
import CartridgeSupercharger from './CartridgeSupercharger';
import CartridgeDPC from './CartridgeDPC';
import CartridgeDPCPlus from './CartridgeDPCPlus';
import CartdridgeCDF from './CartridgeCDF';
import Cartidge8040 from './Cartridge0840';
import CartridgePP from './CartridgePP';

import CartridgeInfo from './CartridgeInfo';
import CartridgeDetector from './CartridgeDetector';
import CartridgeInterface from './CartridgeInterface';

export default class CartridgeFactory {
    async createCartridge(
        buffer: { [i: number]: number; length: number },
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<CartridgeInterface> {
        const cartridge = this._createCartridge(buffer, cartridgeType);

        await cartridge.init();

        return cartridge;
    }

    private _createCartridge(
        buffer: { [i: number]: number; length: number },
        cartridgeType?: CartridgeInfo.CartridgeType
    ): CartridgeInterface {
        if (typeof cartridgeType === 'undefined') {
            const detector = new CartridgeDetector();

            cartridgeType = detector.detectCartridgeType(buffer);
        }

        switch (cartridgeType) {
            case CartridgeInfo.CartridgeType.vanilla_2k:
                return new Cartridge2k(buffer);

            case CartridgeInfo.CartridgeType.vanilla_4k:
                return new Cartridge4k(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_2k_cv:
                return new CartridgeCV(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_F8:
                return new CartridgeF8(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_E0:
                return new CartridgeE0(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_3F:
                return new Cartridge3F(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_FE:
                return new CartridgeFE(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_UA:
                return new CartridgeUA(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_DPC:
                return new CartridgeDPC(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_econobanking:
                return new Cartidge8040(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_8k_pp:
                return new CartridgePP(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_12k_FA:
                return new CartridgeFA(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_16k_F6:
                return new CartridgeF6(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_16k_E7:
                return new CartridgeE7(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_FA2:
                return new CartridgeFA2(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_32k_F4:
                return new CartridgeF4(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_64k_F0:
                return new CartridgeF0(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_64k_EF:
                return new CartridgeEF(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_3E:
                return new Cartridge3E(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_supercharger:
                return new CartridgeSupercharger(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_dpc_plus:
                return new CartridgeDPCPlus(buffer);

            case CartridgeInfo.CartridgeType.bankswitch_cdf:
                return new CartdridgeCDF(buffer);

            default:
                throw new Error(`invalid or unsupported cartridge image`);
        }
    }
}
