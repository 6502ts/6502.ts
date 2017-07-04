/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import Dexie from 'dexie';

import * as Cartridge from './Cartridge';
import * as Settings from './Settings';
import * as Image from './Image';

export default class Database extends Dexie {

    constructor() {
        super('stellerator');

        this.version(1).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType'
        });

        this.version(2).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType',
            settings: 'id'
        });

        this.version(3).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType, emulatePaddles',
            settings: 'id'
        });

        this.version(4)
            .stores({
                cartridge: '++id, &hash',
                settings: 'id'
            })
            .upgrade(transaction => transaction
                .table<Cartridge.CartridgeSchema & {audioEnabled: boolean}, Cartridge.indexType>('cartridge')
                .each((cartridge, c) => {
                    const cursor: IDBCursor = (c as any);

                    if (typeof(cartridge.emulatePaddles) === 'undefined') {
                        cartridge.emulatePaddles = true;
                    }

                    if (typeof(cartridge.rngSeed) === 'undefined') {
                        cartridge.rngSeed = 0;
                    }

                    if (typeof(cartridge.rngSeedAuto) === 'undefined') {
                        cartridge.rngSeedAuto = true;
                    }

                    if (typeof(cartridge.audioEnabled) === 'undefined') {
                        cartridge.audioEnabled = true;
                    }

                    cursor.update(cartridge);
                })
            );

        this.version(5)
            .stores({
                cartridge: '++id, &hash',
                settings: 'id',
                image: '&hash'
            })
            .upgrade(transaction => {
                const images = transaction.table<Image.ImageSchema, Image.indexType>('image');

                transaction
                    .table<Cartridge.CartridgeSchema & {buffer: Uint8Array}, Cartridge.indexType>('cartridge')
                    .each((cartridge, c) => {
                        const cursor: IDBCursor = (c as any);

                        images.add({
                            hash: cartridge.hash,
                            buffer: cartridge.buffer
                        });

                        delete cartridge.buffer;

                        cursor.update(cartridge);
                    });
            });

        this.version(6)
            .stores({
                cartridge: '++id, &hash',
                settings: 'id'
            })
            .upgrade(transaction => {
                transaction
                    .table<Cartridge.CartridgeSchema & {audioEnabled: boolean}, Cartridge.indexType>('cartridge')
                    .each((cartridge, c) => {
                        const cursor: IDBCursor = (c as any);

                        cartridge.volume = cartridge.audioEnabled ? 1 : 0;

                        cursor.update(cartridge);
                    });

                transaction
                    .table<Settings.SettingsSchema, Settings.indexType>('settings')
                    .each((settings, c) => {
                        const cursor: IDBCursor = (c as any);

                        settings.volume = 1;

                        cursor.update(settings);
                    });
            });
    }

    cartridge: Dexie.Table<Cartridge.CartridgeSchema, Cartridge.indexType>;

    settings: Dexie.Table<Settings.SettingsSchema, Settings.indexType>;

    image: Dexie.Table<Image.ImageSchema, Image.indexType>;
}
