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

interface ControlState {
    joystickState: Array<ControlState.JoystickState>;
    paddleState: Array<ControlState.PaddleState>;
    controlPanelState: ControlState.ControlPanelState;
}

namespace ControlState {
    export interface JoystickState {
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        fire: boolean;
    }

    export interface PaddleState {
        value: number;
        fire: boolean;
    }

    export interface ControlPanelState {
        difficulty0: boolean;
        difficulty1: boolean;
        select: boolean;
        reset: boolean;
        color: boolean;
    }
}

export default ControlState;
