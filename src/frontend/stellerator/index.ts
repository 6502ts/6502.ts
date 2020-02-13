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
import GamepadDriver from '../../web/driver/Gamepad';

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
    const oldVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    const wasUpdated = oldVersion && oldVersion !== version;

    localStorage.setItem(VERSION_STORAGE_KEY, version);

    const { ports } = Elm.Stellerator.Main.init({
        flags: {
            cartridges,
            cartridgeTypes,
            settings,
            defaultSettings: DEFAULT_SETTINGS,
            touchSupport: TouchIO.isSupported(),
            version,
            wasUpdated,
            gamepadCount: GamepadDriver.probeGamepadCount()
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
