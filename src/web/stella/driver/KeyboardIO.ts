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

import SwitchInterface from '../../../machine/io/SwitchInterface';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';
import KeypadControllerInterface from '../../../machine/io/KeypadControllerInterface';

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

    bind(
        joystick0: JoystickInterface,
        joystick1: JoystickInterface,
        keypad0: KeypadControllerInterface,
        keypad1: KeypadControllerInterface,
        controlPanel: ControlPanelInterface): void {
        if (this._joystick0) {
            return;
        }

        this._joystick0 = joystick0;
        this._joystick1 = joystick1;
        this._keypad0 = keypad0;
        this._keypad1 = keypad1;
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

    overlay(mappings: Array<KeyboardIO.Mapping>): void {
        this._compileMappings(mappings);
    }

    unbind(): void {
        if (!this._joystick0) {
            return;
        }

        this._target.removeEventListener('keydown', this._keydownListener);
        this._target.removeEventListener('keyup', this._keyupListener);

        this._joystick0 = this._joystick1 = this._keypad0 = this._keypad1 = this._controlPanel = null;
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
        this._dispatchTable[KeyboardIO.Action.keypad0r0c0] = mkSwitch(this._keypad0.getKey(0, 0));
        this._dispatchTable[KeyboardIO.Action.keypad0r0c1] = mkSwitch(this._keypad0.getKey(0, 1));
        this._dispatchTable[KeyboardIO.Action.keypad0r0c2] = mkSwitch(this._keypad0.getKey(0, 2));
        this._dispatchTable[KeyboardIO.Action.keypad0r1c0] = mkSwitch(this._keypad0.getKey(1, 0));
        this._dispatchTable[KeyboardIO.Action.keypad0r1c1] = mkSwitch(this._keypad0.getKey(1, 1));
        this._dispatchTable[KeyboardIO.Action.keypad0r1c2] = mkSwitch(this._keypad0.getKey(1, 2));
        this._dispatchTable[KeyboardIO.Action.keypad0r2c0] = mkSwitch(this._keypad0.getKey(2, 0));
        this._dispatchTable[KeyboardIO.Action.keypad0r2c1] = mkSwitch(this._keypad0.getKey(2, 1));
        this._dispatchTable[KeyboardIO.Action.keypad0r2c2] = mkSwitch(this._keypad0.getKey(2, 2));
        this._dispatchTable[KeyboardIO.Action.keypad0r3c0] = mkSwitch(this._keypad0.getKey(3, 0));
        this._dispatchTable[KeyboardIO.Action.keypad0r3c1] = mkSwitch(this._keypad0.getKey(3, 1));
        this._dispatchTable[KeyboardIO.Action.keypad0r3c2] = mkSwitch(this._keypad0.getKey(3, 2));
        this._dispatchTable[KeyboardIO.Action.keypad1r0c0] = mkSwitch(this._keypad1.getKey(0, 0));
        this._dispatchTable[KeyboardIO.Action.keypad1r0c1] = mkSwitch(this._keypad1.getKey(0, 1));
        this._dispatchTable[KeyboardIO.Action.keypad1r0c2] = mkSwitch(this._keypad1.getKey(0, 2));
        this._dispatchTable[KeyboardIO.Action.keypad1r1c0] = mkSwitch(this._keypad1.getKey(1, 0));
        this._dispatchTable[KeyboardIO.Action.keypad1r1c1] = mkSwitch(this._keypad1.getKey(1, 1));
        this._dispatchTable[KeyboardIO.Action.keypad1r1c2] = mkSwitch(this._keypad1.getKey(1, 2));
        this._dispatchTable[KeyboardIO.Action.keypad1r2c0] = mkSwitch(this._keypad1.getKey(2, 0));
        this._dispatchTable[KeyboardIO.Action.keypad1r2c1] = mkSwitch(this._keypad1.getKey(2, 1));
        this._dispatchTable[KeyboardIO.Action.keypad1r2c2] = mkSwitch(this._keypad1.getKey(2, 2));
        this._dispatchTable[KeyboardIO.Action.keypad1r3c0] = mkSwitch(this._keypad1.getKey(3, 0));
        this._dispatchTable[KeyboardIO.Action.keypad1r3c1] = mkSwitch(this._keypad1.getKey(3, 1));
        this._dispatchTable[KeyboardIO.Action.keypad1r3c2] = mkSwitch(this._keypad1.getKey(3, 2));
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
    private _keypad0: KeypadControllerInterface = null;
    private _keypad1: KeypadControllerInterface = null;
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

        keypad0r0c0,
        keypad0r0c1,
        keypad0r0c2,
        keypad0r1c0,
        keypad0r1c1,
        keypad0r1c2,
        keypad0r2c0,
        keypad0r2c1,
        keypad0r2c2,
        keypad0r3c0,
        keypad0r3c1,
        keypad0r3c2,

        keypad1r0c0,
        keypad1r0c1,
        keypad1r0c2,
        keypad1r1c0,
        keypad1r1c1,
        keypad1r1c2,
        keypad1r2c0,
        keypad1r2c1,
        keypad1r2c2,
        keypad1r3c0,
        keypad1r3c1,
        keypad1r3c2,

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
                65, // a
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

    export const keypad0Mappings: Array<Mapping> = [
        {
            action: Action.keypad0r0c0,
            spec: 49 // 1
        },
        {
            action: Action.keypad0r0c1,
            spec: 50 // 2
        },
        {
            action: Action.keypad0r0c2,
            spec: 51 // 3
        },
        {
            action: Action.keypad0r1c0,
            spec: 81 // q
        },
        {
            action: Action.keypad0r1c1,
            spec: 87 // w
        },
        {
            action: Action.keypad0r1c2,
            spec: 69 // e
        },
        {
            action: Action.keypad0r2c0,
            spec: 65 // a
        },
        {
            action: Action.keypad0r2c1,
            spec: 83 // s
        },
        {
            action: Action.keypad0r2c2,
            spec: 68 // d
        },
        {
            action: Action.keypad0r3c0,
            spec: 90 // z
        },
        {
            action: Action.keypad0r3c1,
            spec: 88 // x
        },
        {
            action: Action.keypad0r3c2,
            spec: 67 // c
        }
    ];

    export const keypad1Mappings: Array<Mapping> = [
        {
            action: Action.keypad1r0c0,
            spec: 56// 8
        },
        {
            action: Action.keypad1r0c1,
            spec: 57 // 9
        },
        {
            action: Action.keypad1r0c2,
            spec: 48 // 0
        },
        {
            action: Action.keypad1r1c0,
            spec: 73 // i
        },
        {
            action: Action.keypad1r1c1,
            spec: 79 // o
        },
        {
            action: Action.keypad1r1c2,
            spec: 80 // p
        },
        {
            action: Action.keypad1r2c0,
            spec: 75 // k
        },
        {
            action: Action.keypad1r2c1,
            spec: 76 // l
        },
        {
            action: Action.keypad1r2c2,
            spec: 186 // ;
        },
        {
            action: Action.keypad1r3c0,
            spec: 188 // ,
        },
        {
            action: Action.keypad1r3c1,
            spec: 190 // .
        },
        {
            action: Action.keypad1r3c2,
            spec: 191 // /
        }
    ];

}

export { KeyboardIO as default };
