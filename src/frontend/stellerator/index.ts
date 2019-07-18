import 'reflect-metadata';

import Elm, { CartridgeType } from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';

import { initialize as initializeRangetouch } from '../common/rangetouch';
import CartridgeInfo from '../../machine/stella/cartridge/CartridgeInfo';

import MediaApi from './service/MediaApi';
import ScrollIntoView from './service/ScrollIntoView';
import AddCartridge from './service/AddCartridge';
import { Container } from 'inversify';
import Storage from './service/Storage';
import TrackCartridges from './service/TrackCartridges';
import TrackSettings from './service/TrackSettings';

async function main(): Promise<void> {
    initializeRangetouch();

    const cartridgeTypes: Array<CartridgeType> = CartridgeInfo.getAllTypes().map(cartridgeType => ({
        key: cartridgeType,
        description: CartridgeInfo.describeCartridgeType(cartridgeType)
    }));

    const container = new Container({ autoBindInjectable: true, defaultScope: 'Singleton' });
    const storage = container.get(Storage);

    const { ports } = Elm.Stellerator.Main.init({
        flags: {
            cartridges: await storage.getAllCartridges(),
            cartridgeTypes,
            settings: await storage.getSettings()
        }
    });

    container.get(MediaApi).init(ports);
    container.get(ScrollIntoView).init(ports);
    container.get(AddCartridge).init(ports);
    container.get(TrackCartridges).init(ports);
    container.get(TrackSettings).init(ports);
}

window.addEventListener('load', main);
