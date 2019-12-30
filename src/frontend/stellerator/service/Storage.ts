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

import Dexie from 'dexie';
import { Cartridge, Settings, CpuEmulation, AudioEmulation } from '../../elm/Stellerator/Main.elm';
import { injectable } from 'inversify';

export interface CartridgeWithImage {
    cartridge: Cartridge;
    image: Uint8Array;
}

interface RomImage {
    hash: string;
    image: Uint8Array;
}

const SETTINGS_ID = 0;
const DB_NAME = 'stellerator-ng';

export const DEFAULT_SETTINGS: Settings = {
    cpuEmulation: CpuEmulation.cycle,
    volume: 80,
    audioEmulation: AudioEmulation.pcm,
    smoothScaling: false,
    phosphorEmulation: true,
    gammaCorrection: 1.0,
    videoSync: true,
    touchControls: undefined,
    leftHanded: false,
    virtualJoystickSensitivity: 10,
    uiMode: undefined,
    uiSize: 100
};

class Database extends Dexie {
    constructor() {
        super(DB_NAME);

        this.version(1).stores({
            cartridges: '&hash',
            roms: '&hash',
            settings: '&id'
        });
    }

    cartridges: Dexie.Table<Cartridge, string>;

    roms: Dexie.Table<RomImage, string>;

    settings: Dexie.Table<Settings & { id: number }, number>;
}

@injectable()
class Storage {
    getAllCartridges(): Promise<Array<Cartridge>> {
        return this._database.cartridges.toArray();
    }

    insertCartridges(cartridges: Array<CartridgeWithImage>): Promise<void> {
        return this._database.transaction('rw', [this._database.cartridges, this._database.roms], async () => {
            await Promise.all([
                this._database.cartridges.bulkPut(cartridges.map(c => c.cartridge)),
                this._database.roms.bulkPut(cartridges.map(c => ({ hash: c.cartridge.hash, image: c.image })))
            ]);
        });
    }

    async updateCartridge(cartridge: Cartridge): Promise<void> {
        return this._database.transaction('rw', [this._database.cartridges], async () => {
            if (!(await this._database.cartridges.get(cartridge.hash))) {
                return;
            }

            await this._database.cartridges.put(cartridge);
        });
    }

    deleteCartridge(hash: string): Promise<void> {
        return this._database.transaction('rw', [this._database.cartridges, this._database.roms], async () => {
            await Promise.all([this._database.cartridges.delete(hash), this._database.roms.delete(hash)]);
        });
    }

    deleteAllCartridges(): Promise<void> {
        return this._database.cartridges.clear();
    }

    getCartridge(hash: string): Promise<Cartridge | undefined> {
        return this._database.cartridges.get(hash);
    }

    async getCartridgeImage(hash: string): Promise<Uint8Array | undefined> {
        const rom = await this._database.roms.get(hash);

        return rom && rom.image;
    }

    async getSettings(): Promise<Settings | undefined> {
        const record = await this._database.settings.get(SETTINGS_ID);

        if (!record) {
            return DEFAULT_SETTINGS;
        }

        const { id, ...settings } = record;
        return settings;
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this._database.settings.put({ ...settings, id: SETTINGS_ID });
    }

    async dropDatabase(): Promise<void> {
        this._database.close();
        await indexedDB.deleteDatabase(DB_NAME);

        this._database = new Database();
    }

    private _database = new Database();
}

export default Storage;
