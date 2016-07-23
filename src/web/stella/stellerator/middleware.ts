import * as redux from 'redux';

import {
    Type as ActionType,
    BatchAction
} from './actions/root';
import State from './state/State';

export const batchMiddleware =
    ((api: redux.MiddlewareAPI<State>) => (next: (a: any) => void) => (a: redux.Action): any =>
{
    if (a && a.type === ActionType.batch) {
        return dispatchBatchedActions(a as BatchAction, api.dispatch);
    }

    return next(a);
}) as any;

function dispatchBatchedActions(action: BatchAction, dispatch: (a: any) => void): Promise<any> {
    let i = -1;

    const dispatcher = (x: any): Promise<any> => ++i >= action.items.length ?
        Promise.resolve(x) :
        Promise.resolve(dispatch(action.items[i])).then(dispatcher);

    return dispatcher(undefined);
}
