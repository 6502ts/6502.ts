// import attachFastclick from 'fastclick';

import Elm, { Cartridge, TvMode, AudioEmulation, CpuEmulation, CartridgeType } from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';

import { initialize as initializeRangetouch } from '../common/rangetouch';
import { initMediaApi } from './mediaApi';
import CartridgeInfo from '../../machine/stella/cartridge/CartridgeInfo';
import { calculateFromString as md5 } from '../../tools/hash/md5';
import { initSrollIntoView } from './scrollIntoView';

const cartridges: Array<Cartridge> = [
    {
        hash: '60283a7dc0e83d4c1bfb4a3140274cd1',
        name: 'Pole Position',
        cartridgeType: CartridgeInfo.CartridgeType.bankswitch_32k_F4,
        tvMode: TvMode.ntsc,
        emulatePaddles: false,
        volume: 66
    },
    {
        hash: '471f63bb5d2b51b3c8c33f90001e83c4',
        name: 'Bobby geht heim',
        cartridgeType: CartridgeInfo.CartridgeType.vanilla_4k,
        tvMode: TvMode.pal,
        emulatePaddles: false,
        volume: 66,
        audioEmulation: AudioEmulation.pcm,
        cpuEmulation: CpuEmulation.cycle,
        firstVisibleLine: 28,
        rngSeed: 42
    },
    ...[
        'Crystal Castles (Atari)',
        'Pitfall',
        'Pitfall II',
        '[HB] Stay Frosty 2',
        'Communist mutants from space',
        'Winter Games (1987) (Epyx, Steven A. Baker, Tod Frye, Peter Engelbrite) (80561-00251) (PAL)',
        ...Array(50)
            .fill(undefined)
            .map((_, i) => `game ${i + 1}`)
    ].map(name => ({
        hash: md5(name),
        name,
        cartridgeType: CartridgeInfo.CartridgeType.bankswitch_32k_F4,
        tvMode: TvMode.ntsc,
        emulatePaddles: false,
        volume: 66
    }))
];

function main(): void {
    // attachFastclick(document.body);
    initializeRangetouch();

    const cartridgeTypes: Array<CartridgeType> = CartridgeInfo.getAllTypes().map(cartridgeType => ({
        key: cartridgeType,
        description: CartridgeInfo.describeCartridgeType(cartridgeType)
    }));

    const { ports } = Elm.Stellerator.Main.init({
        flags: {
            cartridges,
            cartridgeTypes
        }
    });

    initMediaApi(ports);
    initSrollIntoView(ports);
}

window.addEventListener('load', main);
