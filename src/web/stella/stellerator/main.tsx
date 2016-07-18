declare module window {
    export const devToolsExtension: any;
}

// tslint:disable-next-line
import * as React from 'react';
import {render} from 'react-dom';

import {
    hashHistory,
    Redirect,
    Router,
    Route
} from 'react-router';

import {
    applyMiddleware,
    compose,
    createStore
} from 'redux';

import {Provider} from 'react-redux';

import {
    routerMiddleware,
    syncHistoryWithStore
} from 'react-router-redux';

import App from './containers/App';
import CartridgeManager from './containers/CartridgeManager';
import Emulation from './containers/Emulation';
import State from './state/State';
import reducer from './reducers/root';

const store = createStore<State>(
        reducer,
        new State(),
        compose(
            applyMiddleware(routerMiddleware(hashHistory)),
            (window.devToolsExtension ? window.devToolsExtension() : (x: any) => x)
        ) as any
    ),
    history = syncHistoryWithStore(hashHistory, store);

render(
    <Provider store={store}>
        <Router history={history}>
            <Redirect from="/" to="/cartridge-manager"/>
            <Route path="/" component={App}>
                <Route path="cartridge-manager" component={CartridgeManager}/>
                <Route path="emulation" component={Emulation}/>
            </Route>
        </Router>
    </Provider>,
    document.getElementById('react-root')
);
