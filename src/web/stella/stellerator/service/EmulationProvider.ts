import {Middleware} from 'redux';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

interface EmulationProvider {

    getService(): EmulationServiceInterface;

    getMiddleware(): Middleware;

    init(workerUrl?: string): Promise<void>;

}

export default EmulationProvider;
