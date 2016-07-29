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
import {create as createEmulationMiddleware} from './emulation/middleware';
import EmulationDispatcher from './emulation/Dispatcher';
import {batchMiddleware} from './middleware';

import EmulationService from '../service/vanilla/EmulationService';
import EmulationContextInterface from '../service/EmulationContextInterface';
import DriverManager from '../service/DriverManager';
import WebAudioDriver from '../driver/WebAudio';
import GamepadDriver from '../../driver/Gamepad';

const emulationService = new EmulationService(),
    driverManager = new DriverManager(),
    audioDriver = new WebAudioDriver(),
    gamepadDriver = new GamepadDriver();

driverManager.bind(emulationService);

try {
    audioDriver.init();
    driverManager.addDriver(
        audioDriver,
        (context: EmulationContextInterface, driver: WebAudioDriver) => driver.bind(context.getAudio())
    );
} catch (e) {
    console.log(`audio not available: ${e.message}`);
}

try {
    gamepadDriver.init();
    driverManager.addDriver(
        gamepadDriver,
        (context: EmulationContextInterface, driver: GamepadDriver) =>
            driver.bind(context.getJoystick(0), context.getJoystick(1))
    );
} catch (e) {
    console.log(`audio not available: ${e.message}`);
}

const persistenceManager = new PersistenceManager();

const store = createStore<State>(
        reducer,
        new State(),
        compose(
            applyMiddleware(
                thunk,
                batchMiddleware,
                createPersistenceMiddleware(persistenceManager),
                createEmulationMiddleware(emulationService),
                routerMiddleware(hashHistory)
            ),
            (window.devToolsExtension ? window.devToolsExtension() : (x: any) => x)
        ) as any
    );

const emulationDispatcher = new EmulationDispatcher(store);
emulationDispatcher.bind(emulationService);

const history = syncHistoryWithStore(hashHistory, store);

persistenceManager
    .getAllCartridges()
    .then(cartridges => store.dispatch(initCartridges(cartridges)));

render(
    <Provider store={store}>
        <Router history={history}>
            <Redirect from="/" to="/cartridge-manager"/>
            <Route path="/" component={App(emulationService)}>
                <Route path="cartridge-manager" component={CartridgeManager}/>
                <Route path="emulation" component={Emulation}/>
            </Route>
        </Router>
    </Provider>,
    document.getElementById('react-root')
);
