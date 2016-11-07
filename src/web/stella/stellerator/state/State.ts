/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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


import Cartridge from './Cartridge';
import GuiState from './GuiState';
import EmulationState from './Emulation';
import Settings from './Settings';
import Environment from './Environment';

export default class State implements Changeset {

    constructor(changes?: Changeset, old?: State) {
        Object.assign(this, old, changes);
    }

    readonly routing: any;
    readonly cartridges: {[hash: string]: Cartridge} = {};
    readonly currentCartridge: Cartridge = null;

    readonly guiState: GuiState;
    readonly emulationState: EmulationState;
    readonly settings: Settings;
    readonly environment: Environment;
}

interface Changeset {
    routing?: any;
    cartridges?: {[hash: string]: Cartridge};
    currentCartridge?: Cartridge;
    guiState?: GuiState;
    emulationState?: EmulationState;
    settings?: Settings;
    environment?: Environment;
}
