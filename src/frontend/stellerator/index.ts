import 'reflect-metadata';

import Elm, { CartridgeType, Cartridge, Settings } from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';

import { version as packageVersion } from '../../../package.json';

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

const VERSION_STORAGE_KEY = 'stellerator-ng-version';

if (navigator.serviceWorker && !process.env.DEVELOPMENT) {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' });
}

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

    const version = packageVersion.replace(/^(.*)\+.*\.([0-9a-fA-F]+)$/, '$1 build $2');
    const wasUpdated = localStorage.getItem(VERSION_STORAGE_KEY) !== version;

    localStorage.setItem(VERSION_STORAGE_KEY, version);

    const { ports } = Elm.Stellerator.Main.init({
        flags: {
            cartridges,
            cartridgeTypes,
            settings,
            defaultSettings: DEFAULT_SETTINGS,
            touchSupport: TouchIO.isSupported(),
            version,
            wasUpdated
        }
    });

    container.get(MediaApi).init(ports);
    container.get(ScrollIntoView).init(ports);
    container.get(AddCartridge).init(ports);
    container.get(TrackCartridges).init(ports);
    container.get(TrackSettings).init(ports);
    container.get(Emulation).init(ports);

    ports.scrollToTop_.subscribe(() => window.scrollTo(0, 0));
    ports.blurCurrentElement_.subscribe(() => (document.activeElement as HTMLElement).blur());
}

window.addEventListener('load', main);
