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

import Switch from './Switch';

/**
 * The control panel represents the switches on the console and lets you monitor
 * and control them.
 */
interface ControlPanel {
    /**
     * Reset
     */
    reset(): Switch;

    /**
     * Select
     */
    select(): Switch;

    /**
     * Difficulty Player 1: true = amateur [default], false = pro
     */
    difficultyPlayer1(): Switch;

    /**
     * Difficulty Player 2: true = amateur [default], false = pro
     */
    difficultyPlayer2(): Switch;

    /**
     * Color / BW: true = B/W, false = color [default]
     */
    color(): Switch;
}

export { ControlPanel as default };
