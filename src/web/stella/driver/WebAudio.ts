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


import VanillaDriver from '../../driver/WebAudio';
import Board from '../../../machine/stella/Board';

export default class WebAudioDriver {

    init(): void {
        this._driver.init();
    }

    bind(audio: Board.Audio): void {
        if (this._audio) {
            return;
        }
        this._audio = audio;

        this._driver.bind(this._audio.channel0, this._audio.channel1);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._driver.unbind();

        this._audio = null;
    }

    private _driver = new VanillaDriver(2);
    private _audio: Board.Audio = null;
}
