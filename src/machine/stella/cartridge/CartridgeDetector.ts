/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import CartridgeInfo from './CartridgeInfo';
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
import * as cartridgeUtil from './util';

class CartridgeDetector {

    detectCartridgeType(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        if (buffer.length % 8448 === 0) {
            return CartridgeInfo.CartridgeType.bankswitch_supercharger;
        }

        if (buffer.length <= 0x0800) {
            return CartridgeInfo.CartridgeType.vanilla_2k;
        }

        if (buffer.length >= 10240 && buffer.length <= 10496) {
            return CartridgeInfo.CartridgeType.bankswitch_8k_DPC;
        }

        switch (buffer.length) {
            case 0x1000:
                return CartridgeInfo.CartridgeType.vanilla_4k;

            case 0x2000:
                return this._detect8k(buffer);

            case 0x3000:
                return CartridgeInfo.CartridgeType.bankswitch_12k_FA;

            case 0x4000:
                return this._detect16k(buffer);

            case 0x7000:
                return CartridgeInfo.CartridgeType.bankswitch_FA2;

            case 0x7400:
                return this._detect29k(buffer);

            case 0x8000:
                return this._detect32k(buffer);

            case 0x10000:
                return this._detect64k(buffer);

            default:
                return CartridgeInfo.CartridgeType.unknown;
        }
    }

    private _detect8k(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        const f8Matches = CartridgeF8.matchesBuffer(buffer);

        if (CartridgeE0.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_8k_E0;
        }

        if (Cartridge3F.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_8k_3F;
        }

        if (CartridgeUA.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_8k_UA;
        }

        if (!f8Matches && CartridgeFE.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_8k_FE;
        }

        return CartridgeInfo.CartridgeType.bankswitch_8k_F8;
    }

    private _detect16k(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        if (CartridgeE7.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_16k_E7;
        }

        return CartridgeInfo.CartridgeType.bankswitch_16k_F6;
    }

    private _detect29k(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        if (CartridgeFA2.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_FA2;
        }

        return CartridgeInfo.CartridgeType.bankswitch_dpc_plus;
    }

    private _detect32k(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        if (Cartridge3E.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_3E;
        }

        if (CartridgeDPCPlus.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_dpc_plus;
        }

        return CartridgeInfo.CartridgeType.bankswitch_32k_F4;
    }

    private _detect64k(buffer: cartridgeUtil.BufferInterface): CartridgeInfo.CartridgeType {
        if (CartridgeEF.matchesBuffer(buffer)) {
            return CartridgeInfo.CartridgeType.bankswitch_64k_EF;
        }

        return CartridgeInfo.CartridgeType.bankswitch_64k_F0;
    }

}

export default CartridgeDetector;
