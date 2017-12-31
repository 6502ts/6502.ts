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

import * as redux from 'redux';

import { types as ActionType, BatchAction } from './actions/root';
import State from './state/State';

export const batchMiddleware = ((api: redux.MiddlewareAPI<State>) => (next: (a: any) => void) => (
    a: redux.Action
): any => {
    if (a && a.type === ActionType.batch) {
        return dispatchBatchedActions(a as BatchAction, api.dispatch);
    }

    return next(a);
}) as any;

function dispatchBatchedActions(action: BatchAction, dispatch: (a: any) => void): Promise<any> {
    let i = -1;

    const dispatcher = (x: any): Promise<any> =>
        ++i >= action.items.length ? Promise.resolve(x) : Promise.resolve(dispatch(action.items[i])).then(dispatcher);

    return dispatcher(undefined);
}
