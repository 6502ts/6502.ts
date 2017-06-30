import * as React from 'react';
import {Switch, Route, Redirect, RouteComponentProps} from 'react-router';

import CartridgeManager from './containers/CartridgeManager';
import Emulation from './containers/Emulation';
import Settings from './containers/Settings';
import Help from './containers/Help';

type Page = React.ComponentClass<RouteComponentProps<{}>>;

export interface Props {}

export function Routing(props: Props) {
    return (
        <Switch>
            <Route exact path='/cartridge-manager' component={CartridgeManager as Page}/>
            <Route exact path='/emulation' component={Emulation as Page}/>
            <Route exact path='/settings' component={Settings as Page}/>
            <Route exact path='/help' component={Help as Page}/>
            <Redirect from='*' to='/cartridge-manager'/>
        </Switch>
    );
}

export default Routing;
