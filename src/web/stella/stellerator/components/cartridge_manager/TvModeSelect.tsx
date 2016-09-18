// tslint:disable-next-line
import * as React from 'react';

import {
    Button,
    ButtonGroup
} from 'react-bootstrap';

import StellaConfig from '../../../../../machine/stella/Config';

function TvModeSelect(props: TvModeSelect.Props) {
    return <ButtonGroup>
        <Button
            active={props.tvMode === StellaConfig.TvMode.ntsc}
            onClick={() => props.onTvModeChange(StellaConfig.TvMode.ntsc)}
        >NTSC</Button>
        <Button
            active={props.tvMode === StellaConfig.TvMode.pal}
            onClick={() => props.onTvModeChange(StellaConfig.TvMode.pal)}
        >PAL</Button>
        <Button
            active={props.tvMode === StellaConfig.TvMode.secam}
            onClick={() => props.onTvModeChange(StellaConfig.TvMode.secam)}
        >SECAM</Button>
    </ButtonGroup>;
}

module TvModeSelect {

    export interface Props {
        tvMode?: StellaConfig.TvMode;
        onTvModeChange?: (tvMode: StellaConfig.TvMode) => void;
    }

    export const defaultProps = {
        tvMode: StellaConfig.TvMode.ntsc,
        onTvModeChange: (): void => undefined
    };

}

export default TvModeSelect;
