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

import {
    Elm,
    CartridgeType,
    Settings,
    CpuEmulation,
    AudioEmulation,
    TvEmulation,
    Scaling,
} from '../elm/Stellerator/Main.elm';
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
import Emulation from './service/Emulation';
import TouchIO from '../../web/stella/driver/TouchIO';
import GamepadDriver from '../../web/driver/Gamepad';
import { detect as detectWebglCapabilities } from '../../web/driver/video/Capabilities';

const VERSION_STORAGE_KEY =
    process.env.NODE_ENV === 'development' ? 'stellerator-ng-version-dev' : 'stellerator-ng-version';

if (navigator.serviceWorker && process.env.NODE_ENV !== 'development') {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' });
}

const defaultSettings = (badGpu: boolean): Settings => ({
    cpuEmulation: CpuEmulation.cycle,
    volume: 80,
    audioEmulation: AudioEmulation.pcm,
    gammaCorrection: 1.0,
    tvEmulation: badGpu ? TvEmulation.none : TvEmulation.composite,
    scaling: badGpu ? Scaling.bilinear : Scaling.qis,
    phosphorLevel: 50,
    scanlineIntensity: 20,
    touchControls: undefined,
    leftHanded: false,
    virtualJoystickSensitivity: 10,
    uiMode: undefined,
    uiSize: 100,
});

async function main(): Promise<void> {
    initializeRangetouch();

    const cartridgeTypes: Array<CartridgeType> = CartridgeInfo.getAllTypes().map((cartridgeType) => ({
        key: cartridgeType,
        description: CartridgeInfo.describeCartridgeType(cartridgeType),
    }));

    const container = new Container({ autoBindInjectable: true, defaultScope: 'Singleton' });
    const storage = container.get(Storage);
    const capabilities = detectWebglCapabilities();
    const badGpu = !(
        capabilities &&
        (capabilities.floatTextures || capabilities.halfFloatTextures) &&
        capabilities.highpInFsh
    );

    storage.setDefaults(defaultSettings(badGpu));

    const [cartridges, settings] = await Promise.all([storage.getAllCartridges(), storage.getSettings()]);
    const version = process.env.VERSION;
    const oldVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    const wasUpdated = !!oldVersion && oldVersion !== version;

    localStorage.setItem(VERSION_STORAGE_KEY, version);

    const { ports } = Elm.Stellerator.Main.init({
        flags: {
            cartridges,
            cartridgeTypes,
            settings,
            defaultSettings: defaultSettings(badGpu),
            touchSupport: TouchIO.isSupported(),
            version,
            wasUpdated,
            gamepadCount: GamepadDriver.probeGamepadCount(),
            badGpu,
        },
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
