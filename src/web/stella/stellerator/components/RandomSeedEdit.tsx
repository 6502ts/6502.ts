// tslint:disable-next-line
import * as React from 'react';

import ValidatingInput from './ValidatingInput';
import Switch from './Switch'

function RandomSeedEdit(props: RandomSeedEdit.Props) {
    return <div>
        <Switch
            state={props.rngSeedAuto}
            labelTrue="auto"
            labelFalse="fixed"
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

module RandomSeedEdit {

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
    }

}

export default RandomSeedEdit;