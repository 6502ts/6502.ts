// tslint:disable-next-line
import * as React from 'react';
import {render} from 'react-dom';

import {createStore} from 'redux';
import {Provider} from 'react-redux';

import App from './components/App';
import State from './state/State';

const store = createStore<State>((x: State, action: any) => x, new State());

render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('react-root')
);
