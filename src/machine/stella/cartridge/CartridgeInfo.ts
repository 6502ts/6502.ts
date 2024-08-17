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

export enum CartridgeType {
    vanilla_2k = 'vanilla_2k',
    vanilla_4k = 'vanilla_4k',

    bankswitch_2k_cv = 'bankswitch_2k_cv',

    bankswitch_8k_F8 = 'bankswitch_8k_F8',
    bankswitch_8k_E0 = 'bankswitch_8k_E0',
    bankswitch_8k_3F = 'bankswitch_8k_3F',
    bankswitch_8k_FE = 'bankswitch_8k_FE',
    bankswitch_8k_UA = 'bankswitch_8k_UA',
    bankswitch_8k_DPC = 'bankswitch_8k_DPC',
    bankswitch_8k_econobanking = 'bankswitch_8k_econobanking',
    bankswitch_8k_pp = 'bankswitch_8k_pp',

    bankswitch_12k_FA = 'bankswitch_12k_FA',

    bankswitch_16k_F6 = 'bankswitch_16k_F6',
    bankswitch_16k_E7 = 'bankswitch_16k_E7',

    bankswitch_FA2 = 'bankswitch_FA2',

    bankswitch_32k_F4 = 'bankswitch_32k_F4',

    bankswitch_64k_F0 = 'bankswitch_64k_F0',
    bankswitch_64k_EF = 'bankswitch_64k_EF',

    bankswitch_3E = 'bankswitch_3E',
    bankswitch_supercharger = 'bankswitch_supercharger',
    bankswitch_dpc_plus = 'bankswitch_dpc_plus',
    bankswitch_cdf = 'bankswitch_cdf',

    unknown = 'unknown',
}

export function getAllTypes(): Array<CartridgeType> {
    return [
        CartridgeType.vanilla_2k,
        CartridgeType.vanilla_4k,
        CartridgeType.bankswitch_2k_cv,
        CartridgeType.bankswitch_8k_F8,
        CartridgeType.bankswitch_8k_E0,
        CartridgeType.bankswitch_8k_3F,
        CartridgeType.bankswitch_8k_FE,
        CartridgeType.bankswitch_8k_UA,
        CartridgeType.bankswitch_8k_econobanking,
        CartridgeType.bankswitch_8k_pp,
        CartridgeType.bankswitch_12k_FA,
        CartridgeType.bankswitch_8k_DPC,
        CartridgeType.bankswitch_16k_F6,
        CartridgeType.bankswitch_16k_E7,
        CartridgeType.bankswitch_FA2,
        CartridgeType.bankswitch_32k_F4,
        CartridgeType.bankswitch_3E,
        CartridgeType.bankswitch_64k_F0,
        CartridgeType.bankswitch_64k_EF,
        CartridgeType.bankswitch_supercharger,
        CartridgeType.bankswitch_dpc_plus,
        CartridgeType.bankswitch_cdf,
        CartridgeType.unknown,
    ];
}

export function describeCartridgeType(cartridgeType: CartridgeType): string {
    switch (cartridgeType) {
        case CartridgeType.vanilla_2k:
            return 'plain 2k';

        case CartridgeType.vanilla_4k:
            return 'plain 4k';

        case CartridgeType.bankswitch_2k_cv:
            return '2k CommaVideo scheme';

        case CartridgeType.bankswitch_8k_F8:
            return 'bankswitched 8k, F8 (Atari) scheme';

        case CartridgeType.bankswitch_8k_E0:
            return 'bankswitched 8k, E0 (Parker Bros.) scheme';

        case CartridgeType.bankswitch_8k_3F:
            return 'bankswitched 8k, 3F (Tigervision) scheme';

        case CartridgeType.bankswitch_8k_FE:
            return 'bankswitched 8k, FE (Activision) scheme';

        case CartridgeType.bankswitch_8k_UA:
            return 'bankswitched 8k, UA (Pleiades) scheme';

        case CartridgeType.bankswitch_8k_pp:
            return 'bankswitched 8k, Pink Panther scheme';

        case CartridgeType.bankswitch_12k_FA:
            return 'bankswitched 12k, FA (CBS) scheme';

        case CartridgeType.bankswitch_8k_DPC:
            return 'bankswitched 8k + DPC';

        case CartridgeType.bankswitch_8k_econobanking:
            return 'bankswitched 8k, econobanking scheme';

        case CartridgeType.bankswitch_16k_F6:
            return 'bankswitched 16k, F6 (Atari) scheme';

        case CartridgeType.bankswitch_16k_E7:
            return 'bankswitched 16k, E7 (M-Network) scheme';

        case CartridgeType.bankswitch_FA2:
            return 'bankswitched 28k/29k, FA2 (modified CBS) scheme';

        case CartridgeType.bankswitch_32k_F4:
            return 'bankswitched 32k, F4 (Atari) scheme';

        case CartridgeType.bankswitch_3E:
            return 'bankswitched 3E (Tigervision + RAM) scheme';

        case CartridgeType.bankswitch_64k_F0:
            return 'bankswitched 64k, F0 (Megaboy) scheme';

        case CartridgeType.bankswitch_64k_EF:
            return 'bankswitched 64k, EFSC (Homestar Runner) scheme';

        case CartridgeType.bankswitch_supercharger:
            return 'bankswitched supercharger';

        case CartridgeType.bankswitch_dpc_plus:
            return 'bankswitched DPC+';

        case CartridgeType.bankswitch_cdf:
            return 'bankswitched CDF';

        case CartridgeType.unknown:
            return 'unknown';
    }
}
