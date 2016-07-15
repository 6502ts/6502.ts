// tslint:disable-next-line
import * as React from 'react';
import {render} from 'react-dom';

import {createStore} from 'redux';
import {Provider} from 'react-redux';

import App from './containers/App';
import State from './state/State';
import reducer from './reducers/reducer';

const store = createStore<State>(reducer, new State());

render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('react-root')
);
