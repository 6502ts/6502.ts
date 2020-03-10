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
import { Ports, Cartridge } from '../../elm/Stellerator/Main.elm';
import Storage from './Storage';
import Emulation from './Emulation';
import { Mutex } from 'async-mutex';
import FileSaver from 'file-saver';

@injectable()
class TrackCartridges {
    constructor(@inject(Storage) private _storage: Storage, @inject(Emulation) private _emulation: Emulation) {}

    init(ports: Ports): void {
        ports.updateCartridge_.subscribe(this._onCartridgeUpdated);
        ports.deleteCartridge_.subscribe(this._onCartridgeDeleted);
        ports.deleteAllCartridges_.subscribe(this._onDeleteAllCartridges);
        ports.saveCartridge_.subscribe(this._onSaveCartridge);
    }

    private async _updateCartridge(cartridge: Cartridge): Promise<void> {
        await this._storage.updateCartridge(cartridge);
        await this._emulation.updateCartridge(cartridge);
    }

    private _onCartridgeUpdated = (cartridge: Cartridge) => {
        if (this._updateCartridgeHandle === null) {
            this._updateCartridgeHandle = window.setTimeout(() => {
                this._updateCartridgeHandle = null;

                this._mutex.runExclusive(() => this._updateCartridge(cartridge));
            }, 100);
        }
    };

    private _onCartridgeDeleted = (hash: string) => this._storage.deleteCartridge(hash);

    private _onDeleteAllCartridges = () => this._storage.deleteAllCartridges();

    private _onSaveCartridge = async (hash: string) => {
        const [cartridge, image] = await Promise.all([
            this._storage.getCartridge(hash),
            this._storage.getCartridgeImage(hash)
        ]);

        if (!cartridge || !image) {
            return;
        }

        FileSaver.saveAs(new Blob([image], { type: 'application/octet-stream' }), cartridge.name + '.bin', {
            autoBom: false
        });
    };

    private _updateCartridgeHandle: number = null;
    private _mutex = new Mutex();
}

export default TrackCartridges;
