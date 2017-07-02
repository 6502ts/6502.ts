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

import {Event} from 'microevent.ts';

import SwitchInterface from '../../../machine/io/SwitchInterface';
import Switch from '../../../machine/io/Switch';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';

class KeyboardIO {

    constructor(
        private _target: HTMLElement|HTMLDocument,
        // tslint:disable-next-line
        mappings: Array<KeyboardIO.Mapping> = KeyboardIO.defaultMappings
    ) {
        this._compileMappings(mappings);

        this._fullscreenSwitch.stateChanged.addHandler(
            state => state ? this.toggleFullscreen.dispatch(undefined) : true
        );

        this._resetSwitch.stateChanged.addHandler(
            state => state ? this.hardReset.dispatch(undefined) : true
        );

        this._togglePauseSwitch.stateChanged.addHandler(
            state => state ? this.togglePause.dispatch(undefined) : true
        );
    }

    bind(
        joystick0: JoystickInterface,
        joystick1: JoystickInterface,
        controlPanel: ControlPanelInterface
    ): void {
        if (this._joystick0) {
            return;
        }

        this._joystick0 = joystick0;
        this._joystick1 = joystick1;
        this._controlPanel = controlPanel;

        this._updateActionTable();

        const decodeAction = (e: KeyboardEvent): KeyboardIO.Action => {
            if (this._compiledMappings[e.keyCode]) {
                const modifiers = (
                    (e.shiftKey ? KeyboardIO.Modifier.shift : 0) |
                    (e.ctrlKey ? KeyboardIO.Modifier.ctrl : 0) |
                    (e.altKey ? KeyboardIO.Modifier.alt : 0)
                );

                return this._compiledMappings[e.keyCode][modifiers];
            }

            return undefined;
        };

        this._keydownListener = e => {
            const action = decodeAction(e);

            if (typeof(action) !== 'undefined') {
                e.preventDefault();
                this._actionTable[action].toggle(true);
            }
        };

        this._keyupListener = e => {
            const action = decodeAction(e);

            if (typeof(action) !== 'undefined') {
                e.preventDefault();
                this._actionTable[action].toggle(false);
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
        this._actionTable[KeyboardIO.Action.fullscreen]     = this._fullscreenSwitch;
        this._actionTable[KeyboardIO.Action.hardReset]      = this._resetSwitch;
        this._actionTable[KeyboardIO.Action.togglePause]    = this._togglePauseSwitch;
        this._actionTable[KeyboardIO.Action.select]         = this._controlPanel.getSelectSwitch();
        this._actionTable[KeyboardIO.Action.reset]          = this._controlPanel.getResetButton();
        this._actionTable[KeyboardIO.Action.left0]          = this._joystick0.getLeft();
        this._actionTable[KeyboardIO.Action.right0]         = this._joystick0.getRight();
        this._actionTable[KeyboardIO.Action.up0]            = this._joystick0.getUp();
        this._actionTable[KeyboardIO.Action.down0]          = this._joystick0.getDown();
        this._actionTable[KeyboardIO.Action.fire0]          = this._joystick0.getFire();
        this._actionTable[KeyboardIO.Action.left1]          = this._joystick1.getLeft();
        this._actionTable[KeyboardIO.Action.right1]         = this._joystick1.getRight();
        this._actionTable[KeyboardIO.Action.up1]            = this._joystick1.getUp();
        this._actionTable[KeyboardIO.Action.down1]          = this._joystick1.getDown();
        this._actionTable[KeyboardIO.Action.fire1]          = this._joystick1.getFire();
    }

    private _compileMappings(mappings: Array<KeyboardIO.Mapping>): void {
        const compileMapping = (action: KeyboardIO.Action, keycode: number, modifiers: number) => {
            if ((modifiers & ~(
                    KeyboardIO.Modifier.shift |
                    KeyboardIO.Modifier.ctrl |
                    KeyboardIO.Modifier.alt)) !== 0
            ) {
                throw new Error(`invalid modifier set ${modifiers}`);
            }

            if (!this._compiledMappings[keycode]) {
                this._compiledMappings[keycode] = {};
            }

            this._compiledMappings[keycode][modifiers] = action;
        };

        mappings.forEach(mapping => {
            const action = mapping.action,
                specs = Array.isArray(mapping.spec) ? mapping.spec : [mapping.spec];

            specs.forEach(spec => compileMapping(
                action,
                typeof(spec) === 'object' ? spec.keycode : spec,
                typeof(spec) === 'object' ? spec.modifiers : 0
            ));
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

    private _fullscreenSwitch = new Switch();
    private _resetSwitch = new Switch();
    private _togglePauseSwitch = new Switch();

    private _actionTable: {[action: number]: SwitchInterface} = {};
    private _compiledMappings: {
        [keycode: number]: {
            [modifier: number]: KeyboardIO.Action
        }
    } = {};
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
        }, {
            action: Action.reset,
            spec: {
                keycode: 13, // enter
                modifiers: Modifier.shift
            }
        }, {
            action: Action.left0,
            spec: [
                65, // w
                37  // left
            ]
        }, {
            action: Action.right0,
            spec: [
                68, // d
                39  // right
            ]
        }, {
            action: Action.up0,
            spec: [
                87, // w
                38  // up
            ]
        }, {
            action: Action.down0,
            spec: [
                83, // s
                40  // down
            ]
        }, {
            action: Action.fire0,
            spec: [
                32, // space
                86  // v
            ]
        }, {
            action: Action.left1,
            spec: 74 // j
        }, {
            action: Action.right1,
            spec: 76 // l
        }, {
            action: Action.up1,
            spec: 73 // i
        }, {
            action: Action.down1,
            spec: 75 // k
        }, {
            action: Action.fire1,
            spec: 66 // b
        }, {
            action: Action.fullscreen,
            spec: 13 // enter
        }, {
            action: Action.hardReset,
            spec: {
                keycode: 82, // r
                modifiers: Modifier.shift
            }
        }, {
            action: Action.togglePause,
            spec: 80 // p
        }
    ];

}

export default KeyboardIO;
