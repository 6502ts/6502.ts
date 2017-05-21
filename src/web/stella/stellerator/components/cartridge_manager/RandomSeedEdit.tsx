/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import ValidatingInput from '../ValidatingInput';
import Switch from '../Switch';

function RandomSeedEdit(props: RandomSeedEdit.Props) {
    return <div>
        <Switch
            state={props.rngSeedAuto}
            labelTrue='auto'
            labelFalse='fixed'
            onSwitch={props.onChangeSeedStrategy}
        />
        <ValidatingInput
            value={'' + props.rngSeedValue}
            readOnly={props.rngSeedAuto}
            validator={(value: string): boolean => !!value.match(/^(0|([1-9]\d*))$/)}
            onChange={(value: string) => props.onChangeSeedValue(parseInt(value, 10))}
            onKeyEnter={props.onKeyEnter}
            style={{
                display: props.rngSeedAuto ? 'none' : 'inline-block',
                marginLeft: '1rem',
                width: '6rem'
            }}
        />
    </div>;
}

namespace RandomSeedEdit {

    export interface Props {
        rngSeedAuto?: boolean;
        rngSeedValue?: number;

        onChangeSeedStrategy?: (auto: boolean) => void;
        onChangeSeedValue?: (value: number) => void;
        onKeyEnter?: () => void;
    }

    export const defaultProps: Props = {
        rngSeedAuto: true,
        rngSeedValue: 0,

        onChangeSeedStrategy: () => undefined,
        onChangeSeedValue: () => undefined,
        onKeyEnter: () => undefined
    };

}

export default RandomSeedEdit;
