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
import { styled } from '../style';

export interface Props {
    className?: string;

    value?: number;
    max?: number;
    min?: number;
    step?: number;
    wheelWeight?: number;

    onChange?: (newValue: number) => void;
}

const Container = styled.div`
    display: flex;
    min-width: 4rem;
    align-items: center;
`;

const Label = styled.div`padding-left: 1rem;`;

function Slider(props: Props) {
    return (
        <Container
            onWheel={(e: React.WheelEvent<HTMLDivElement>) => {
                e.preventDefault();
                e.stopPropagation();

                const newValue = props.value + e.deltaY * props.wheelWeight * props.step;

                if (newValue < props.min) {
                    props.onChange(props.min);
                } else if (newValue > props.max) {
                    props.onChange(props.max);
                } else {
                    props.onChange(newValue);
                }
            }}
        >
            <input
                type="range"
                value={props.value.toString()}
                min={props.min.toString()}
                max={props.max.toString()}
                step={props.step.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange(parseFloat(e.target.value))}
            />
            <Label>{props.value.toFixed(2)}</Label>
        </Container>
    );
}

namespace Slider {
    export const defaultProps: Props = {
        value: 0,
        max: 0,
        min: 1,
        step: 0.01,
        wheelWeight: 0.1,

        onChange: () => undefined
    };
}

export { Slider as default };
