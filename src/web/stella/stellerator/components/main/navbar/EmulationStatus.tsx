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
import { styled, StyledComponent } from '../../style';

import EmulationServiceInterface from '../../../../service/EmulationServiceInterface';

export interface Props {
    className?: string;
    emulationState: EmulationServiceInterface.State;
    frequency: number;
}

export function EmulationStatusUnstyled(props: Props) {
    return <span className={props.className}>{describeState(props.emulationState, props.frequency)}</span>;
}

function describeState(state: EmulationServiceInterface.State, frequency: number): string {
    switch (state) {
        case EmulationServiceInterface.State.stopped:
            return 'stopped';

        case EmulationServiceInterface.State.running:
            return frequency > 0 ? `running: ${(frequency / 1e6).toFixed(2)} MHz` : 'running';

        case EmulationServiceInterface.State.paused:
            return 'paused';

        case EmulationServiceInterface.State.error:
            return 'emulation error';
    }
}

type EmulationStatusStyled = StyledComponent<Props>;

const EmulationStatusStyled: EmulationStatusStyled = styled(EmulationStatusUnstyled)`margin-left: 1rem;`;

export default EmulationStatusStyled;
