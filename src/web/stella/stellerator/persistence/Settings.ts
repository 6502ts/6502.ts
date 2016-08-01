import SettingsState from '../state/Settings';

export const UNIQUE_ID = 0;

export type indexType = number;

export interface Type {

    id: number;
    smoothScaling: boolean;

}

export function fromState(state: SettingsState): Type {
    return {
        id: UNIQUE_ID,
        smoothScaling: state.smoothScaling
    };
}

export function toState(record?: Type): SettingsState {
    return new SettingsState(record);
}
