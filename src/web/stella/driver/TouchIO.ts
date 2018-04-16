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

import DoubleTapDetector from './touch/DoubleTapDetector';
import DigitalJoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import SwitchInterface from '../../../machine/io/SwitchInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';

const enum TouchType {
    alt = 'alt',
    fire = 'fire',
    joystick = 'joystick',
    select = 'select',
    reset = 'reset',
    pause = 'pause',
    unknown = 'unknown'
}

class TouchIO {
    constructor(private _canvas: HTMLCanvasElement, private _joystickSensitivity = 15) {
        this.toggleFullscreen = this._fullscreenDoubleTapDetector.trigger;
    }

    bind(joystick: DigitalJoystickInterface, controlPanel: ControlPanelInterface): void {
        if (this._bound) {
            return;
        }

        this._bound = true;

        this._joystick = joystick;
        this._select = controlPanel.getSelectSwitch();
        this._reset = controlPanel.getResetButton();

        this._bindListeners();
    }

    unbind(): void {
        if (!this._bound) {
            return;
        }

        this._unbindListeners();

        (this._bound = false), (this._joystick = this._reset = this._select = null);
    }

    private _bindListeners(): void {
        this._canvas.addEventListener('touchstart', this._onTouchStart);
        this._canvas.addEventListener('touchend', this._onTouchEnd);
        this._canvas.addEventListener('touchmove', this._onTouchMove);
    }

    private _unbindListeners(): void {
        this._canvas.removeEventListener('touchstart', this._onTouchStart);
        this._canvas.removeEventListener('touchend', this._onTouchEnd);
        this._canvas.removeEventListener('touchmove', this._onTouchMove);
    }

    private _cancelEvent(touch: NormalizedTouch): boolean {
        return touch.type !== TouchType.alt;
    }

    private _onTouchStart = (e: TouchEvent): void => {
        let cancel = false;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const normalizedTouch = new NormalizedTouch(e.changedTouches.item(i), this._canvas),
                id = normalizedTouch.touch.identifier;

            if (normalizedTouch.x <= 0.5) {
                if (normalizedTouch.y <= 0.5) {
                    // NW
                    normalizedTouch.type = TouchType.alt;
                } else {
                    // SW
                    normalizedTouch.type = this._isAlt ? TouchType.pause : TouchType.fire;
                }
            } else {
                if (normalizedTouch.y <= 0.5) {
                    // NE
                    normalizedTouch.type = this._isAlt ? TouchType.select : TouchType.joystick;
                } else {
                    // SE
                    normalizedTouch.type = this._isAlt ? TouchType.reset : TouchType.joystick;
                }
            }

            if (this._pendingTouches.has(id) || this._pendingTouches.has(normalizedTouch.type)) {
                continue;
            }

            this._pendingTouches.set(id, normalizedTouch);
            this._pendingTouches.set(normalizedTouch.type, normalizedTouch);

            switch (normalizedTouch.type) {
                case TouchType.alt:
                    this._isAlt = true;
                    this._fullscreenDoubleTapDetector.startTouch();
                    break;

                case TouchType.fire:
                    this._joystick.getFire().toggle(true);
                    break;

                case TouchType.pause:
                    this.togglePause.dispatch(undefined);
                    this._fullscreenDoubleTapDetector.cancelTouch();
                    break;

                case TouchType.select:
                    this._select.toggle(true);
                    this._fullscreenDoubleTapDetector.cancelTouch();
                    break;

                case TouchType.reset:
                    this._reset.toggle(true);
                    this._fullscreenDoubleTapDetector.cancelTouch();
                    break;

                case TouchType.joystick:
                    break;

                default:
                    throw new Error('invalid touch type');
            }

            if (this._cancelEvent(normalizedTouch) && !this._fullscreenDoubleTapDetector.isDispatching()) {
                cancel = true;
            }
        }

        if (cancel) {
            e.preventDefault();
        }
    };

    private _onTouchEnd = (e: TouchEvent): void => {
        let cancel = false;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const normalizedTouch = this._pendingTouches.get(e.changedTouches.item(i).identifier);

            if (!normalizedTouch) {
                continue;
            }

            if (this._cancelEvent(normalizedTouch) && !this._fullscreenDoubleTapDetector.isDispatching()) {
                cancel = true;
            }

            switch (normalizedTouch.type) {
                case TouchType.alt:
                    this._isAlt = false;
                    this._fullscreenDoubleTapDetector.endTouch();
                    break;

                case TouchType.fire:
                    this._joystick.getFire().toggle(false);
                    break;

                case TouchType.select:
                    this._select.toggle(false);
                    break;

                case TouchType.reset:
                    this._reset.toggle(false);
                    break;

                case TouchType.joystick:
                    this._joystick.getDown().toggle(false);
                    this._joystick.getUp().toggle(false);
                    this._joystick.getLeft().toggle(false);
                    this._joystick.getRight().toggle(false);
                    break;

                case TouchType.pause:
                    break;

                default:
                    throw new Error('invalid touch type');
            }

            this._pendingTouches.delete(normalizedTouch.type);
            this._pendingTouches.delete(normalizedTouch.touch.identifier);
        }

        if (cancel) {
            e.preventDefault();
        }
    };

    private _onTouchMove = (e: TouchEvent): void => {
        let cancel = false;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches.item(i),
                normalizedTouch = this._pendingTouches.get(touch.identifier);

            if (!normalizedTouch) {
                continue;
            }

            if (this._cancelEvent(normalizedTouch)) {
                cancel = true;
            }

            if (normalizedTouch.type !== TouchType.joystick) {
                continue;
            }

            const deltaX = touch.clientX - normalizedTouch.touch.clientX,
                deltaY = touch.clientY - normalizedTouch.touch.clientY;

            this._joystick.getLeft().toggle(deltaX < -this._joystickSensitivity);
            this._joystick.getRight().toggle(deltaX > this._joystickSensitivity);
            this._joystick.getUp().toggle(deltaY < -this._joystickSensitivity);
            this._joystick.getDown().toggle(deltaY > this._joystickSensitivity);
        }

        if (cancel) {
            e.preventDefault();
        }
    };

    toggleFullscreen: Event<void>;
    togglePause = new Event<void>();

    private _fullscreenDoubleTapDetector = new DoubleTapDetector();

    private _bound = false;

    private _joystick: DigitalJoystickInterface = null;
    private _select: SwitchInterface = null;
    private _reset: SwitchInterface = null;

    private _isAlt = false;

    private _pendingTouches = new Map<number | TouchType, NormalizedTouch>();
}

class NormalizedTouch {
    constructor(public touch: Touch, canvas: HTMLCanvasElement) {
        const boundingRect = canvas.getBoundingClientRect();

        this.x = (touch.clientX - boundingRect.left) / boundingRect.width;
        this.y = (touch.clientY - boundingRect.top) / boundingRect.height;
    }

    x: number;
    y: number;
    type = TouchType.unknown;
}

export default TouchIO;
