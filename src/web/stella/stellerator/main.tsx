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
import thunk from 'redux-thunk';

import {
    routerMiddleware,
    syncHistoryWithStore
} from 'react-router-redux';

import App from './containers/App';
import CartridgeManager from './containers/CartridgeManager';
import Emulation from './containers/Emulation';
import State from './state/State';
import reducer from './reducers/root';
import PersistenceManager from './persistence/Manager';
import {create as createPersistenceMiddleware} from './persistence/middleware';
import {initCartridges} from './actions/root';

const persistenceManager = new PersistenceManager(),
    store = createStore<State>(
        reducer,
        new State(),
        compose(
            applyMiddleware(
                createPersistenceMiddleware(persistenceManager),
                thunk,
                routerMiddleware(hashHistory)
            ),
            (window.devToolsExtension ? window.devToolsExtension() : (x: any) => x)
        ) as any
    ),
    history = syncHistoryWithStore(hashHistory, store);

persistenceManager
    .getAllCartridges()
    .then(cartridges => store.dispatch(initCartridges(cartridges)));

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
