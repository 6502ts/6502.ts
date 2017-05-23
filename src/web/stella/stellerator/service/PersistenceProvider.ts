import {Middleware} from 'redux';

interface PersistenceProvider {

    init(): Promise<any>;

    getMiddleware(): Middleware;

}

export default PersistenceProvider;
