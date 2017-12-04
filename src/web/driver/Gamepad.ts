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

import { Event } from 'microevent.ts';

import DigitalJoystickInterface from '../../machine/io/DigitalJoystickInterface';
import SwitchInterface from '../../machine/io/SwitchInterface';

const MIN_POLL_INTERVAL = 50;

const enum MappingButton {
    left = 'left',
    right = 'right',
    up = 'up',
    down = 'down',
    fire = 'fire',
    start = 'start',
    select = 'select'
}

const standardMappings: { [button: string]: Array<number> } = {
    [MappingButton.up]: [12],
    [MappingButton.down]: [13],
    [MappingButton.left]: [14],
    [MappingButton.right]: [15],
    [MappingButton.fire]: [0, 1, 2, 3, 10, 11],
    [MappingButton.select]: [8],
    [MappingButton.start]: [9]
};

export default class GamepadDriver {
    init(): void {
        if (!navigator.getGamepads) {
            throw new Error(`gamepad API not available`);
        }

        this._probeGamepads();
        window.addEventListener('gamepadconnected', this._onGamepadConnect);
        window.addEventListener('gamepaddisconnected', this._onGamepadDisconnect);
    }

    deinit(): void {
        this.unbind();

        window.removeEventListener('gamepadconnected', this._onGamepadConnect);
        window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnect);
    }

    bind({
        joysticks = null,
        start = null,
        select = null
    }: {
        joysticks?: Array<DigitalJoystickInterface>;
        start?: SwitchInterface;
        select?: SwitchInterface;
    }): void {
        if (this._bound) {
            return;
        }

        this._joysticks = joysticks || [];
        this._start = start;
        this._select = select;
        this._bound = true;

        this._joysticksShadow = this._joysticks.map(x => createShadowJoystick());
        this._startShadow = this._start ? new ShadowSwitch() : null;
        this._selectShadow = this._select ? new ShadowSwitch() : null;

        this._controlledSwitches().forEach(swtch =>
            swtch.beforeRead.addHandler(GamepadDriver._onBeforeSwitchRead, this)
        );

        this._initShadows();
    }

    unbind(): void {
        if (!this._bound) {
            return;
        }

        this._controlledSwitches().forEach(swtch =>
            swtch.beforeRead.removeHandler(GamepadDriver._onBeforeSwitchRead, this)
        );

        this._joysticks = this._start = this._select = null;
        this._bound = false;
    }

    getGamepadCount(): number {
        return this._gamepadCount;
    }

    private static _onBeforeSwitchRead(swtch: SwitchInterface, self: GamepadDriver) {
        const now = Date.now();

        if (self._gamepadCount === 0 || now - self._lastPoll < MIN_POLL_INTERVAL) {
            return;
        }

        self._lastPoll = now;

        let gamepadCount = 0,
            joystickIndex = 0,
            start = false,
            select = false;

        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];

            if (!gamepad) {
                continue;
            }

            gamepadCount++;

            self._updateJoystickState(gamepad, joystickIndex++);

            start = start || self._readState(standardMappings[MappingButton.start], gamepad);
            select = select || self._readState(standardMappings[MappingButton.select], gamepad);
        }

        if (gamepadCount > 0) {
            if (self._start) {
                self._startShadow.toggle(start);
            }

            if (self._select) {
                self._selectShadow.toggle(select);
            }
        }

        self._syncShadows();
    }

    private _controlledSwitches(): Array<SwitchInterface> {
        const switches: Array<SwitchInterface> = [];

        for (const joystick of this._joysticks) {
            switches.push(
                joystick.getLeft(),
                joystick.getRight(),
                joystick.getUp(),
                joystick.getDown(),
                joystick.getFire()
            );
        }

        if (this._select) {
            switches.push(this._select);
        }

        if (this._start) {
            switches.push(this._start);
        }

        return switches;
    }

    private _readState(mapping: Array<number>, gamepad: Gamepad): boolean {
        let state = false;

        for (let i = 0; i < mapping.length; i++) {
            const button: GamepadButton | number = gamepad.buttons[mapping[i]];

            state = state || (typeof button === 'object' ? button.pressed : button >= 0.5);
        }

        return state;
    }

    private _updateJoystickState(gamepad: Gamepad, joystickIndex: number): void {
        if (!this._joysticks || joystickIndex >= this._joysticks.length) {
            return;
        }

        const joystick = this._joysticksShadow[joystickIndex];

        joystick[MappingButton.left].toggle(this._readState(standardMappings[MappingButton.left], gamepad));
        joystick[MappingButton.right].toggle(this._readState(standardMappings[MappingButton.right], gamepad));
        joystick[MappingButton.up].toggle(this._readState(standardMappings[MappingButton.up], gamepad));
        joystick[MappingButton.down].toggle(this._readState(standardMappings[MappingButton.down], gamepad));
        joystick[MappingButton.fire].toggle(this._readState(standardMappings[MappingButton.fire], gamepad));

        if (gamepad.axes[0] < -0.5 || gamepad.axes[2] < -0.5) {
            joystick[MappingButton.left].toggle(true);
        }

        if (gamepad.axes[0] > 0.5 || gamepad.axes[2] > 0.5) {
            joystick[MappingButton.right].toggle(true);
        }

        if (gamepad.axes[1] < -0.5 || gamepad.axes[3] < -0.5) {
            joystick[MappingButton.up].toggle(true);
        }

        if (gamepad.axes[1] > 0.5 || gamepad.axes[3] > 0.5) {
            joystick[MappingButton.down].toggle(true);
        }
    }

    private _initShadows(): void {
        if (this._joysticks) {
            for (let i = 0; i < this._joysticks.length; i++) {
                const original = this._joysticks[i],
                    shadow = this._joysticksShadow[i];

                shadow[MappingButton.left].setState(original.getLeft().peek());
                shadow[MappingButton.right].setState(original.getRight().peek());
                shadow[MappingButton.up].setState(original.getUp().peek());
                shadow[MappingButton.down].setState(original.getDown().peek());
                shadow[MappingButton.fire].setState(original.getFire().peek());
            }
        }

        if (this._start) {
            this._startShadow.setState(this._start.peek());
        }

        if (this._select) {
            this._selectShadow.setState(this._select.peek());
        }
    }

    private _syncShadows(): void {
        if (this._joysticks) {
            for (let i = 0; i < this._joysticks.length; i++) {
                const original = this._joysticks[i],
                    shadow = this._joysticksShadow[i];

                shadow[MappingButton.left].sync(original.getLeft());
                shadow[MappingButton.right].sync(original.getRight());
                shadow[MappingButton.up].sync(original.getUp());
                shadow[MappingButton.down].sync(original.getDown());
                shadow[MappingButton.fire].sync(original.getFire());
            }
        }

        if (this._start) {
            this._startShadow.sync(this._start);
        }

        if (this._select) {
            this._selectShadow.sync(this._select);
        }
    }

    private _probeGamepads(): void {
        let cnt = 0;

        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                cnt++;
            }
        }

        if (cnt !== this._gamepadCount) {
            this._gamepadCount = cnt;
            this.gamepadCountChanged.dispatch(this._gamepadCount);
        }
    }

    private _onGamepadConnect = () => this._probeGamepads();
    private _onGamepadDisconnect = () => this._probeGamepads();

    gamepadCountChanged = new Event<number>();

    private _bound = false;
    private _gamepadCount = 0;
    private _lastPoll = 0;

    private _joysticks: Array<DigitalJoystickInterface> = null;
    private _start: SwitchInterface = null;
    private _select: SwitchInterface = null;

    private _joysticksShadow: Array<ShadowJoystick> = null;
    private _startShadow: ShadowSwitch = null;
    private _selectShadow: ShadowSwitch = null;
}

class ShadowSwitch {
    toggle(state: boolean): void {
        if (state === this._state) {
            return;
        }

        this._state = state;
        this._dirty = true;
    }

    setState(state: boolean): void {
        this._state = state;
        this._dirty = false;
    }

    sync(swtch: SwitchInterface): void {
        if (this._dirty) {
            swtch.toggle(this._state);
            this._dirty = false;
        }
    }

    private _state = false;
    private _dirty = false;
}

interface ShadowJoystick {
    [button: string]: ShadowSwitch;
}

function createShadowJoystick(): ShadowJoystick {
    return {
        [MappingButton.left]: new ShadowSwitch(),
        [MappingButton.right]: new ShadowSwitch(),
        [MappingButton.up]: new ShadowSwitch(),
        [MappingButton.down]: new ShadowSwitch(),
        [MappingButton.fire]: new ShadowSwitch()
    };
}
