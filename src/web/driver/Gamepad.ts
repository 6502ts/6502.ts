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

import { Event } from 'microevent.ts';

import ShadowSwitch from './gamepad/ShadowSwitch';
import DigitalJoystickInterface from '../../machine/io/DigitalJoystickInterface';
import SwitchInterface from '../../machine/io/SwitchInterface';
import { Target, Mapping, MappingType, Sign } from './gamepad/Mapping';
import { defaultMapping } from './gamepad/defaultMapping';

const MIN_POLL_INTERVAL = 50;

export const joystickTargets: Array<Target> = [
    Target.left,
    Target.right,
    Target.up,
    Target.down,
    Target.fire,
    Target.start,
    Target.select,
    Target.pause
];

export type AuxTarget = Target.start | Target.select | Target.pause;
export const auxTargets: Array<Target> = [Target.start, Target.select, Target.pause];

function readButton(button: GamepadButton | number): boolean {
    return typeof button === 'object' ? button.pressed : button > 0.5;
}

export default class GamepadDriver {
    constructor() {
        this.setMapping(defaultMapping);
    }

    init(): void {
        if (!navigator.getGamepads) {
            throw new Error(`gamepad API not available`);
        }

        this.probeGamepads();
        window.addEventListener('gamepadconnected', this._onGamepadConnect);
        window.addEventListener('gamepaddisconnected', this._onGamepadDisconnect);
    }

    deinit(): void {
        this.unbind();

        window.removeEventListener('gamepadconnected', this._onGamepadConnect);
        window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnect);
    }

    bind(
        joysticks: Array<DigitalJoystickInterface> = [],
        auxSwitches: Partial<Record<AuxTarget, SwitchInterface>> = {}
    ): void {
        if (this._bound) {
            return;
        }
        this._bound = true;

        this._joysticks = joysticks;
        this._auxSwitches = auxSwitches;
        this._bound = true;

        this._shadows = new WeakMap();

        this._controlledSwitches().forEach(swtch => {
            const shadow = new ShadowSwitch();

            this._shadows.set(swtch, shadow);
            shadow.setState(swtch.read());

            swtch.beforeRead.addHandler(GamepadDriver._onBeforeSwitchRead, this);
        });
    }

    unbind(): void {
        if (!this._bound) {
            return;
        }

        this._controlledSwitches().forEach(swtch =>
            swtch.beforeRead.removeHandler(GamepadDriver._onBeforeSwitchRead, this)
        );

        this._shadows = null;
        this._auxSwitches = {};
        this._joysticks = [];

        this._bound = false;
    }

    getGamepadCount(): number {
        return this._gamepadCount;
    }

    setMapping(mapping: Array<Mapping>, id?: string) {
        if (typeof id !== 'undefined') {
            this._mappings.set(id, mapping);
        }

        const states = new Map<Target, boolean>();
        const targets: Array<Target> = [];

        for (const m of mapping) {
            if (targets.indexOf(m.target)) {
                targets.push(m.target);
                states.set(m.target, false);
            }
        }

        this._mappingStates.set(mapping, states);
        this._mappingTargets.set(mapping, targets);
    }

    clearMapping(id: string) {
        this._mappings.delete(id);
    }

    poll() {
        this._readGamepads();
    }

    private static _onBeforeSwitchRead(swtch: SwitchInterface, self: GamepadDriver) {
        self.poll();
    }

    private probeGamepads(): void {
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

    private _getSwitchForTarget(target: Target, joystick: DigitalJoystickInterface = null): SwitchInterface | null {
        if (this._auxSwitches[target as AuxTarget]) {
            return this._auxSwitches[target as AuxTarget];
        }

        if (!joystick) {
            return null;
        }

        switch (target) {
            case Target.up:
                return joystick.getUp();

            case Target.down:
                return joystick.getDown();

            case Target.left:
                return joystick.getLeft();

            case Target.right:
                return joystick.getRight();

            case Target.fire:
                return joystick.getFire();

            default:
                return null;
        }
    }

    private _controlledSwitches(): Array<SwitchInterface> {
        const switches: Array<SwitchInterface> = [
            ...Object.keys(this._auxSwitches).map(target => this._auxSwitches[target as AuxTarget])
        ];

        for (const joystick of this._joysticks) {
            switches.push(
                joystick.getLeft(),
                joystick.getRight(),
                joystick.getUp(),
                joystick.getDown(),
                joystick.getFire()
            );
        }

        return switches;
    }

    private _readGamepads() {
        const now = Date.now();

        if (this._gamepadCount === 0 || now - this._lastPoll < MIN_POLL_INTERVAL) {
            return;
        }

        this._lastPoll = now;

        const gamepads = navigator.getGamepads();

        let joystickIndex = 0;

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];

            if (!gamepad) {
                continue;
            }

            const mapping = this._mappings.get(gamepad.id) || defaultMapping;

            const states = this._mappingStates.get(mapping);
            const targets = this._mappingTargets.get(mapping);

            for (const target of targets) {
                states.set(target, false);
            }

            for (const mappingEntry of mapping) {
                switch (mappingEntry.type) {
                    case MappingType.button:
                        const button = gamepad.buttons[mappingEntry.index];

                        if (typeof button !== 'undefined' && readButton(button)) {
                            states.set(mappingEntry.target, true);
                        }

                        break;

                    case MappingType.axis:
                        const axis = gamepad.axes[mappingEntry.index];

                        if (
                            typeof axis !== 'undefined' &&
                            (mappingEntry.sign === Sign.positive ? axis > 0.5 : axis < -0.5)
                        ) {
                            states.set(mappingEntry.target, true);
                        }

                        break;
                }
            }

            for (const target of targets) {
                const swtch = this._getSwitchForTarget(target, this._joysticks[joystickIndex]);
                if (!swtch) {
                    continue;
                }

                const shadow = this._shadows.get(swtch);

                shadow.toggle(states.get(target));

                shadow.sync(swtch);
            }

            joystickIndex++;
        }
    }

    private _onGamepadConnect = () => this.probeGamepads();

    private _onGamepadDisconnect = () => this.probeGamepads();

    gamepadCountChanged = new Event<number>();

    private _shadows: WeakMap<SwitchInterface, ShadowSwitch> = null;
    private _mappings = new Map<string, Array<Mapping>>();
    private _mappingStates = new WeakMap<Array<Mapping>, Map<Target, boolean>>();
    private _mappingTargets = new WeakMap<Array<Mapping>, Array<Target>>();

    private _bound = false;
    private _joysticks: Array<DigitalJoystickInterface> = [];
    private _auxSwitches: Partial<Record<AuxTarget, SwitchInterface>> = {};

    private _gamepadCount = 0;
    private _lastPoll = 0;
}
