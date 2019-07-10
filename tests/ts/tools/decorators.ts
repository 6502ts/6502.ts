/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import assert from 'assert';

import { Immutable, freezeImmutables } from '../../../src/tools/decorators';

suite('decorators', () => {
    suite('@Immutable', () => {
        test('@Immutable fields are not writable', () => {
            class Test {
                constructor() {
                    freezeImmutables(this);
                }

                @Immutable someField = 666;
            }

            const test = new Test();

            assert.strictEqual(test.someField, 666);
            assert.throws(() => (test.someField = 333));
        });

        test('@Immutable fields are not configurable', () => {
            class Test {
                constructor() {
                    freezeImmutables(this);
                }

                @Immutable someField = 666;
            }

            const test = new Test();

            assert.strictEqual(test.someField, 666);
            assert.throws(() => Object.defineProperty(test, 'someField', { writable: true }));
        });
    });
});
