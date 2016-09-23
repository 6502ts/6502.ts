declare module _stelleratorSettings {
    export const workerUrl: string;
    export const helppageUrl: string;
    export const buildId: string;
}

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
import Settings from './containers/Settings';
import Help from './containers/Help';

import PersistenceManager from './persistence/Manager';
import {create as createPersistenceMiddleware} from './persistence/middleware';

import {initCartridges} from './actions/root';
import {initSettings} from './actions/settings';
import {initialize as initializeEnvironment} from './actions/environment';

import State from './state/State';
import reducer from './reducers/root';
import EmulationMiddleware from './emulation/Middleware';
import EmulationDispatcher from './emulation/Dispatcher';
import {batchMiddleware} from './middleware';
import {init as initEmulation} from './emulation';

const persistenceManager = new PersistenceManager(),
    emulationMiddleware = new EmulationMiddleware();

const store = createStore<State>(
        reducer,
        new State(),
        compose(
            applyMiddleware(
                thunk,
                batchMiddleware,
                createPersistenceMiddleware(persistenceManager),
                emulationMiddleware.getMiddleware(),
                routerMiddleware(hashHistory)
            ),
            (
                (process.env.NODE_ENV !== 'production' && window.devToolsExtension) ?
                    window.devToolsExtension() :
                    (x: any) => x
            )
        ) as any
    );

store.dispatch(initializeEnvironment({
    helppageUrl: _stelleratorSettings.helppageUrl,
    buildId: _stelleratorSettings.buildId
}));

const history = syncHistoryWithStore(hashHistory, store);

Promise
    .all([
        persistenceManager
            .getAllCartridges()
            .then(cartridges => store.dispatch(initCartridges(cartridges))),
        persistenceManager
            .getSettings()
            .then(settings => store.dispatch(initSettings(settings)))
    ])
    .then(() => initEmulation(store, _stelleratorSettings.workerUrl))
    .then(emulationService => {
        emulationMiddleware.setEmulationService(emulationService);

        const emulationDispatcher = new EmulationDispatcher(store);
        emulationDispatcher.bind(emulationService);

        return emulationService;
    })
    .then(emulationService => render(
        <Provider store={store}>
            <Router history={history}>
                <Redirect from="/" to="/cartridge-manager"/>
                <Route path="/" component={App(emulationService)}>
                    <Route path="cartridge-manager" component={CartridgeManager}/>
                    <Route path="emulation" component={Emulation}/>
                    <Route path="settings" component={Settings}/>
                    <Route path="help" component={Help}/>
                </Route>
            </Router>
        </Provider>,
        document.getElementById('react-root')
    ));
