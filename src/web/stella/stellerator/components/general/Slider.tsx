import * as React from 'react';
import {styled} from '../style';

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

const Label = styled.div`
    padding-left: 1rem;
`;

function Slider(props: Props) {
    return (
        <Container
            onWheel={(e: React.WheelEvent<HTMLDivElement>) => {
                e.preventDefault();
                e.stopPropagation();

                const newValue = props.value + e.deltaY * props.wheelWeight * props.step;

                if (newValue < props.min) {
                    props.onChange(props.min);
                }
                else if (newValue > props.max) {
                    props.onChange(props.max);
                }
                else {
                    props.onChange(newValue);
                }
            }}
        >
            <input
                type='range'
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

export default Slider;
