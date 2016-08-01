import * as redux from 'redux';

import {
    Type as ActionType
} from '../actions/root';

import {
    isSettingsChange
} from '../actions/settings';

import Manager from './Manager';
import State from '../state/State';

export function create(manager: Manager): redux.Middleware {
    return ((api: redux.MiddlewareAPI<State>) => (next: (a: any) => void) => (a: redux.Action): any => {
        if (!a) {
            return next(a);
        }

        if (isSettingsChange(a)) {
            return Promise
                .resolve(next(a))
                .then(() => manager.saveSettings(api.getState().settings));
        }

        switch (a.type) {
            case ActionType.saveCurrentCartridge:
                return manager
                    .saveCartridge(api.getState().currentCartridge)
                    .then(() => next(a));

            case ActionType.deleteCurrentCartridge:
                return manager
                    .deleteCartridge(api.getState().currentCartridge)
                    .then(() => next(a));

            default:
                return next(a);
        }
    }) as any;
}
