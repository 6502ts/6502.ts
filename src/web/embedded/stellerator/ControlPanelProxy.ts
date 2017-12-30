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

import Switch from './Switch';
import SwitchProxy from './SwitchProxy';
import ControlPanel from './ControlPanel';
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

export default ControlPanelProxy;
