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

declare namespace _stelleratorSettings {
    export const workerUrl: string;
    export const helppageUrl: string;
    export const buildId: string;
}

declare namespace window {
    export const devToolsExtension: any;
}

import * as React from 'react';
import { render } from 'react-dom';
import { createHashHistory } from 'history';
import { applyMiddleware, compose, createStore } from 'redux';
import { ThemeProvider } from 'styled-components';
import { Provider as ReduxProvider } from 'react-redux';
import { routerMiddleware, ConnectedRouter } from 'react-router-redux';

import { Provider as EmulationProvider } from './context/Emulation';
import { initialize as initializeEnvironment } from './actions/environment';
import State from './state/State';
import reducer from './reducers/root';
import { batchMiddleware } from './middleware';
import ServiceContainer from './service/implementation/Container';
import Main from './containers/Main';
import Routing from './Routing';

async function main() {
    const serviceContainer = new ServiceContainer(),
        history = createHashHistory();

    const store = createStore<State>(reducer, new State(), compose(
        applyMiddleware(
            batchMiddleware,
            serviceContainer.getPersistenceProvider().getMiddleware(),
            serviceContainer.getEmulationProvider().getMiddleware(),
            serviceContainer.getCartridgeManager().getMiddleware(),
            routerMiddleware(history)
        ),
        process.env.NODE_ENV !== 'production' && window.devToolsExtension ? window.devToolsExtension() : (x: any) => x
    ) as any);

    serviceContainer.setStore(store);

    store.dispatch(
        initializeEnvironment({
            helppageUrl: _stelleratorSettings.helppageUrl,
            buildId: _stelleratorSettings.buildId
        })
    );

    await serviceContainer.getPersistenceProvider().init();
    await serviceContainer
        .getEmulationProvider()
        .init(store.getState().settings.useWorker ? _stelleratorSettings.workerUrl : undefined);

    render(
        <ThemeProvider theme={{}}>
            <ReduxProvider store={store}>
                <EmulationProvider emulationProvider={serviceContainer.getEmulationProvider()}>
                    <ConnectedRouter history={history} store={store as any}>
                        <Main>
                            <Routing />
                        </Main>
                    </ConnectedRouter>
                </EmulationProvider>
            </ReduxProvider>
        </ThemeProvider>,
        document.getElementById('react-root')
    );
}

main();
