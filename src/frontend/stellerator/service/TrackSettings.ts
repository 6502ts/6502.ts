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

import { injectable, inject } from 'inversify';
import Storage from './Storage';
import { Ports, Settings } from '../../elm/Stellerator/Main.elm';
import Emulation from './Emulation';
import { Mutex } from 'async-mutex';

@injectable()
class TrackSettings {
    constructor(@inject(Storage) private _storage: Storage, @inject(Emulation) private _emulation: Emulation) {}

    init(ports: Ports): void {
        ports.updateSettings_.subscribe(this._onSettingsUpdate);
    }

    private async updateSettings(settings: Settings): Promise<void> {
        await this._storage.saveSettings(settings);
        await this._emulation.updateSettings(settings);
    }

    private _onSettingsUpdate = (settings: Settings) => this._mutex.runExclusive(() => this.updateSettings(settings));

    private _mutex = new Mutex();
}

export default TrackSettings;
