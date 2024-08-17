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

import { Switch } from './Switch';
import SwitchProxy from './SwitchProxy';
import { ControlPanel } from './ControlPanel';
import StellaControlPanel from '../../../machine/stella/ControlPanelInterface';

class ControlPanelProxy implements ControlPanel {
    bind(controlPanel: StellaControlPanel): void {
        this.unbind();

        this._boundControlPanel = controlPanel;

        this._reset.bind(this._boundControlPanel.getResetButton());
        this._select.bind(this._boundControlPanel.getSelectSwitch());
        this._difficultyPlayer1.bind(this._boundControlPanel.getDifficultySwitchP0());
        this._difficultyPlayer2.bind(this._boundControlPanel.getDifficultySwitchP1());
        this._color.bind(this._boundControlPanel.getColorSwitch());

        this._difficultyPlayer1.toggle(true);
        this._difficultyPlayer2.toggle(true);
    }

    unbind(): void {
        if (!this._boundControlPanel) {
            return;
        }

        this._reset.unbind();
        this._select.unbind();
        this._difficultyPlayer1.unbind();
        this._difficultyPlayer2.unbind();
        this._color.unbind();

        this._boundControlPanel = null;
    }

    reset(): Switch {
        return this._reset;
    }

    select(): Switch {
        return this._select;
    }

    difficultyPlayer1(): Switch {
        return this._difficultyPlayer1;
    }

    difficultyPlayer2(): Switch {
        return this._difficultyPlayer2;
    }

    color(): Switch {
        return this._color;
    }

    private _reset = new SwitchProxy();
    private _select = new SwitchProxy();
    private _difficultyPlayer1 = new SwitchProxy();
    private _difficultyPlayer2 = new SwitchProxy();
    private _color = new SwitchProxy();

    private _boundControlPanel: StellaControlPanel = null;
}

export { ControlPanelProxy as default };
