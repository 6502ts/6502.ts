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

function defaultDriverName(driver: Settings.AudioDriver): string {
    switch (driver) {
        case Settings.AudioDriver.pcm:
            return 'PCM';

        case Settings.AudioDriver.waveform:
            return 'Waveform';

        default:
            throw new Error(`invalid driver: ${driver}`);
    }
}

function AudioDriverSelect(props: AudioDriverSelect.Props) {
    return (
        <ButtonGroup>
            <Button
                active={props.driver === CartridgeModel.AudioDriver.default}
                onClick={() => props.onDriverChange(CartridgeModel.AudioDriver.default)}
            >
                Default ({defaultDriverName(props.defaultDriver)})
            </Button>
            <Button
                active={props.driver === CartridgeModel.AudioDriver.pcm}
                onClick={() => props.onDriverChange(CartridgeModel.AudioDriver.pcm)}
            >
                PCM
            </Button>
            <Button
                active={props.driver === CartridgeModel.AudioDriver.waveform}
                onClick={() => props.onDriverChange(CartridgeModel.AudioDriver.waveform)}
            >
                Waveform
            </Button>
        </ButtonGroup>
    );
}

namespace AudioDriverSelect {
    export interface Props {
        driver: CartridgeModel.AudioDriver;
        defaultDriver: Settings.AudioDriver;
        onDriverChange?: (newDriver: CartridgeModel.AudioDriver) => void;
    }

    export const defaultProps: Partial<Props> = {
        onDriverChange: () => undefined
    };
}

export default AudioDriverSelect;
