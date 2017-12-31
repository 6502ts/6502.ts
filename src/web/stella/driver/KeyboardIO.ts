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

import { Event } from 'microevent.ts';

import SwitchInterface from '../../../machine/io/SwitchInterface';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';

const enum DispatchType {
    swtch,
    triggerDown
}

interface SwitchDispatch {
    type: DispatchType.swtch;
    swtch: SwitchInterface;
}

interface TriggerDispatch {
    type: DispatchType.triggerDown;
    trigger: Event<void>;
}

type Dispatch = SwitchDispatch | TriggerDispatch;

function mkSwitch(swtch: SwitchInterface): SwitchDispatch {
    return {
        type: DispatchType.swtch,
        swtch
    };
}

function mkTrigger(event: Event<void>): TriggerDispatch {
    return {
        type: DispatchType.triggerDown,
        trigger: event
    };
}

class KeyboardIO {
    constructor(
        private _target: HTMLElement | HTMLDocument,
        // tslint:disable-next-line
        mappings: Array<KeyboardIO.Mapping> = KeyboardIO.defaultMappings
    ) {
        this._compileMappings(mappings);
    }

    bind(joystick0: JoystickInterface, joystick1: JoystickInterface, controlPanel: ControlPanelInterface): void {
        if (this._joystick0) {
            return;
        }

        this._joystick0 = joystick0;
        this._joystick1 = joystick1;
        this._controlPanel = controlPanel;

        this._updateActionTable();

        this._keydownListener = e => {
            if (!this._compiledMappings.has(e.keyCode)) {
                return;
            }

            const modifiers =
                (e.shiftKey ? KeyboardIO.Modifier.shift : 0) |
                (e.ctrlKey ? KeyboardIO.Modifier.ctrl : 0) |
                (e.altKey ? KeyboardIO.Modifier.alt : 0);

            if (!this._compiledMappings.get(e.keyCode).has(modifiers)) {
                return;
            }

            const action = this._compiledMappings.get(e.keyCode).get(modifiers);

            if (typeof action !== 'undefined') {
                e.preventDefault();

                const dispatch = this._dispatchTable[action];
                switch (dispatch.type) {
                    case DispatchType.swtch:
                        dispatch.swtch.toggle(true);
                        break;

                    case DispatchType.triggerDown:
                        dispatch.trigger.dispatch(undefined);
                        break;

                    default:
                }
            }
        };

        this._keyupListener = e => {
            if (!this._compiledMappings.has(e.keyCode)) {
                return;
            }

            for (const action of this._compiledMappings.get(e.keyCode).values()) {
                e.preventDefault();

                const dispatch = this._dispatchTable[action];

                switch (dispatch.type) {
                    case DispatchType.swtch:
                        dispatch.swtch.toggle(false);
                        break;

                    default:
                }
            }
        };

        this._target.addEventListener('keydown', this._keydownListener);
        this._target.addEventListener('keyup', this._keyupListener);
    }

    unbind(): void {
        if (!this._joystick0) {
            return;
        }

        this._target.removeEventListener('keydown', this._keydownListener);
        this._target.removeEventListener('keyup', this._keyupListener);

        this._joystick0 = this._joystick1 = this._controlPanel = null;
        this._keydownListener = this._keyupListener = null;
    }

    private _updateActionTable(): void {
        this._dispatchTable[KeyboardIO.Action.fullscreen] = mkTrigger(this.toggleFullscreen);
        this._dispatchTable[KeyboardIO.Action.hardReset] = mkTrigger(this.hardReset);
        this._dispatchTable[KeyboardIO.Action.togglePause] = mkTrigger(this.togglePause);
        this._dispatchTable[KeyboardIO.Action.select] = mkSwitch(this._controlPanel.getSelectSwitch());
        this._dispatchTable[KeyboardIO.Action.reset] = mkSwitch(this._controlPanel.getResetButton());
        this._dispatchTable[KeyboardIO.Action.left0] = mkSwitch(this._joystick0.getLeft());
        this._dispatchTable[KeyboardIO.Action.right0] = mkSwitch(this._joystick0.getRight());
        this._dispatchTable[KeyboardIO.Action.up0] = mkSwitch(this._joystick0.getUp());
        this._dispatchTable[KeyboardIO.Action.down0] = mkSwitch(this._joystick0.getDown());
        this._dispatchTable[KeyboardIO.Action.fire0] = mkSwitch(this._joystick0.getFire());
        this._dispatchTable[KeyboardIO.Action.left1] = mkSwitch(this._joystick1.getLeft());
        this._dispatchTable[KeyboardIO.Action.right1] = mkSwitch(this._joystick1.getRight());
        this._dispatchTable[KeyboardIO.Action.up1] = mkSwitch(this._joystick1.getUp());
        this._dispatchTable[KeyboardIO.Action.down1] = mkSwitch(this._joystick1.getDown());
        this._dispatchTable[KeyboardIO.Action.fire1] = mkSwitch(this._joystick1.getFire());
    }

    private _compileMappings(mappings: Array<KeyboardIO.Mapping>): void {
        const compileMapping = (action: KeyboardIO.Action, keycode: number, modifiers: number) => {
            if ((modifiers & ~(KeyboardIO.Modifier.shift | KeyboardIO.Modifier.ctrl | KeyboardIO.Modifier.alt)) !== 0) {
                throw new Error(`invalid modifier set ${modifiers}`);
            }

            if (!this._compiledMappings.has(keycode)) {
                this._compiledMappings.set(keycode, new Map<number, KeyboardIO.Action>());
            }

            this._compiledMappings.get(keycode).set(modifiers, action);
        };

        mappings.forEach(mapping => {
            const action = mapping.action,
                specs = Array.isArray(mapping.spec) ? mapping.spec : [mapping.spec];

            specs.forEach(spec =>
                compileMapping(
                    action,
                    typeof spec === 'object' ? spec.keycode : spec,
                    typeof spec === 'object' ? spec.modifiers : 0
                )
            );
        });
    }

    toggleFullscreen = new Event<void>();
    hardReset = new Event<void>();
    togglePause = new Event<void>();

    private _keydownListener: (e: KeyboardEvent) => void = null;
    private _keyupListener: (e: KeyboardEvent) => void = null;

    private _joystick0: JoystickInterface = null;
    private _joystick1: JoystickInterface = null;
    private _controlPanel: ControlPanelInterface = null;

    private _dispatchTable: { [action: number]: Dispatch } = {};
    private _compiledMappings = new Map<number, Map<number, KeyboardIO.Action>>();
}

namespace KeyboardIO {
    export const enum Action {
        select,
        reset,
        left0,
        right0,
        up0,
        down0,
        left1,
        right1,
        up1,
        down1,
        fire0,
        fire1,

        fullscreen,
        hardReset,
        togglePause
    }

    export const enum Modifier {
        ctrl = 1,
        alt = 2,
        shift = 4
    }

    export interface ComplexKeySpec {
        keycode: number;
        modifiers: number;
    }

    export type keySpec = number | ComplexKeySpec;

    export interface Mapping {
        action: Action;
        spec: keySpec | Array<keySpec>;
    }

    export const defaultMappings: Array<Mapping> = [
        {
            action: Action.select,
            spec: {
                keycode: 32, // space
                modifiers: Modifier.shift
            }
        },
        {
            action: Action.reset,
            spec: {
                keycode: 13, // enter
                modifiers: Modifier.shift
            }
        },
        {
            action: Action.left0,
            spec: [
                65, // w
                37 // left
            ]
        },
        {
            action: Action.right0,
            spec: [
                68, // d
                39 // right
            ]
        },
        {
            action: Action.up0,
            spec: [
                87, // w
                38 // up
            ]
        },
        {
            action: Action.down0,
            spec: [
                83, // s
                40 // down
            ]
        },
        {
            action: Action.fire0,
            spec: [
                32, // space
                86 // v
            ]
        },
        {
            action: Action.left1,
            spec: 74 // j
        },
        {
            action: Action.right1,
            spec: 76 // l
        },
        {
            action: Action.up1,
            spec: 73 // i
        },
        {
            action: Action.down1,
            spec: 75 // k
        },
        {
            action: Action.fire1,
            spec: 66 // b
        },
        {
            action: Action.fullscreen,
            spec: 13 // enter
        },
        {
            action: Action.hardReset,
            spec: {
                keycode: 82, // r
                modifiers: Modifier.shift
            }
        },
        {
            action: Action.togglePause,
            spec: 80 // p
        }
    ];
}

export default KeyboardIO;
