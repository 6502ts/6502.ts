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

import * as React from 'react';

import { Button, ButtonGroup } from 'react-bootstrap';

import CartridgeModel from '../../model/Cartridge';
import Settings from '../../model/Settings';

function defaultAccuracySettingName(accuracySetting: Settings.CpuAccuracy): string {
    switch (accuracySetting) {
        case Settings.CpuAccuracy.cycle:
            return 'Cycle';

        case Settings.CpuAccuracy.instruction:
            return 'Instruction';

        default:
            throw new Error(`invalid accuracySetting: ${accuracySetting}`);
    }
}

function CpuAccuracySelect(props: CpuAccuracySelect.Props) {
    return (
        <ButtonGroup>
            <Button
                active={props.accuracy === CartridgeModel.CpuAccuracy.default}
                onClick={() => props.onAccuracyChange(CartridgeModel.CpuAccuracy.default)}
            >
                Default ({defaultAccuracySettingName(props.defaultAccuracy)})
            </Button>
            <Button
                active={props.accuracy === CartridgeModel.CpuAccuracy.cycle}
                onClick={() => props.onAccuracyChange(CartridgeModel.CpuAccuracy.cycle)}
            >
                Cycle
            </Button>
            <Button
                active={props.accuracy === CartridgeModel.CpuAccuracy.instruction}
                onClick={() => props.onAccuracyChange(CartridgeModel.CpuAccuracy.instruction)}
            >
                Instruction
            </Button>
        </ButtonGroup>
    );
}

namespace CpuAccuracySelect {
    export interface Props {
        accuracy: CartridgeModel.CpuAccuracy;
        defaultAccuracy: Settings.CpuAccuracy;
        onAccuracyChange?: (newDriver: CartridgeModel.CpuAccuracy) => void;
    }

    export const defaultProps: Partial<Props> = {
        onAccuracyChange: () => undefined
    };
}

export default CpuAccuracySelect;
