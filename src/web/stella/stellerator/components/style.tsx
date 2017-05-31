import {ComponentClass, Ref} from 'react';
import * as styledComponents from 'styled-components';
import {ThemedStyledComponentsModule} from 'styled-components';

import Theme from './style/Theme';

export type StyledComponentProps<Props, RefT = void> = Props & {
    innerRef?: Ref<RefT>;
    theme?: Theme;
};

export type StyledComponent<Props, RefT = void> = ComponentClass<StyledComponentProps<Props, RefT>>;

const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider
} = styledComponents as ThemedStyledComponentsModule<Theme>;

export {styled, css, injectGlobal, keyframes, ThemeProvider};

export default styled;
