import 'reflect-metadata';

import Elm, { CartridgeType, Cartridge, Settings } from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';

import { initialize as initializeRangetouch } from '../common/rangetouch';
import CartridgeInfo from '../../machine/stella/cartridge/CartridgeInfo';

import MediaApi from './service/MediaApi';
import ScrollIntoView from './service/ScrollIntoView';
import AddCartridge from './service/AddCartridge';
import { Container } from 'inversify';
import Storage, { DEFAULT_SETTINGS } from './service/Storage';
import TrackCartridges from './service/TrackCartridges';
import TrackSettings from './service/TrackSettings';
import Emulation from './service/Emulation';
import TouchIO from '../../web/stella/driver/TouchIO';

async function main(): Promise<void> {
    initializeRangetouch();

    const cartridgeTypes: Array<CartridgeType> = CartridgeInfo.getAllTypes().map(cartridgeType => ({
        key: cartridgeType,
        description: CartridgeInfo.describeCartridgeType(cartridgeType)
    }));

    const container = new Container({ autoBindInjectable: true, defaultScope: 'Singleton' });
    const storage = container.get(Storage);

    let cartridges: Array<Cartridge>;
    let settings: Settings | undefined;

    try {
        [cartridges, settings] = await Promise.all([storage.getAllCartridges(), storage.getSettings()]);
    } catch (e) {
        await storage.dropDatabase();

        [cartridges, settings] = await Promise.all([storage.getAllCartridges(), storage.getSettings()]);
    }

    const { ports } = Elm.Stellerator.Main.init({
        flags: {
            cartridges,
            cartridgeTypes,
            settings,
            defaultSettings: DEFAULT_SETTINGS,
            touchSupport: TouchIO.isSupported()
        }
    });

    container.get(MediaApi).init(ports);
    container.get(ScrollIntoView).init(ports);
    container.get(AddCartridge).init(ports);
    container.get(TrackCartridges).init(ports);
    container.get(TrackSettings).init(ports);
    container.get(Emulation).init(ports);
}

window.addEventListener('load', main);
