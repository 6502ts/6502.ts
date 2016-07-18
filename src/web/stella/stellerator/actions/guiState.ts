import {Action} from 'redux';

import GuiState from '../state/GuiState';

export const Type = {
    setMode: 'GUI-STATE/SET-MODE'
};
Object.freeze(Type);

export interface SetModeAction extends Action {
    guiMode: GuiState.GuiMode;
}

export function setMode(guiMode: GuiState.GuiMode) {
    return {
        type: Type.setMode,
        guiMode
    };
}
