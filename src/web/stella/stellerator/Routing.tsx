/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

import * as React from 'react';
import { Switch, Route, Redirect, RouteComponentProps } from 'react-router';

import CartridgeManager from './containers/CartridgeManager';
import Emulation from './containers/Emulation';
import Settings from './containers/Settings';
import Help from './containers/Help';

type Page = React.ComponentClass<RouteComponentProps<{}>>;

export interface Props {}

export function Routing(props: Props) {
    return (
        <Switch>
            <Route exact path="/cartridge-manager" component={CartridgeManager as Page} />
            <Route exact path="/emulation" component={Emulation as Page} />
            <Route exact path="/settings" component={Settings as Page} />
            <Route exact path="/help" component={Help as Page} />
            <Redirect from="*" to="/cartridge-manager" />
        </Switch>
    );
}

export default Routing;
