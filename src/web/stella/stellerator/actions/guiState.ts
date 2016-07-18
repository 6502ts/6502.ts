import {Action} from 'redux';

import GuiState from '../state/GuiState';

export enum Type {
    setMode
}

export interface SetModeAction extends Action {
    guiMode: GuiState.GuiMode;
}

export function setMode(guiMode: GuiState.GuiMode) {
    return {
        type: Type.setMode,
        guiMode
    };
}
