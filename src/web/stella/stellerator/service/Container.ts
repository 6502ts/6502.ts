import {Store} from 'redux';

import EmulationProvider from './EmulationProvider';
import State from '../state/State';

interface Container {

    getEmulationProvider(): EmulationProvider;

    setStore(store: Store<State>): this;

}

export default Container;
