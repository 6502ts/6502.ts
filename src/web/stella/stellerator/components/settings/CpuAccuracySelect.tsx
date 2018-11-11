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
import Settings from '../../model/Settings';

function CpuAccuracySelect(props: CpuAccuracySelect.Props) {
    return (
        <ButtonGroup>
            <Button
                active={props.cpuAccuracy === Settings.CpuAccuracy.cycle}
                onClick={() => props.onCpuAccuracyChange(Settings.CpuAccuracy.cycle)}
            >
                Cycle
            </Button>
            <Button
                active={props.cpuAccuracy === Settings.CpuAccuracy.instruction}
                onClick={() => props.onCpuAccuracyChange(Settings.CpuAccuracy.instruction)}
            >
                Instruction
            </Button>
        </ButtonGroup>
    );
}

namespace CpuAccuracySelect {
    export interface Props {
        cpuAccuracy: Settings.CpuAccuracy;
        onCpuAccuracyChange?: (newAccuracy: Settings.CpuAccuracy) => void;
    }

    export const defaultProps: Partial<Props> = {
        onCpuAccuracyChange: () => undefined
    };
}

export default CpuAccuracySelect;
