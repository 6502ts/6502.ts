declare function postMessage(message: any, transfer?: any): void;

import RpcProvider from '../../src/tools/worker/RpcProvider';
import EmulationBackend from '../../src/web/stella/service/worker/EmulationBackend';

const rpcProvider = new RpcProvider(
        (message, transfer?) => postMessage(message, transfer)
    ),
    emulationBackend = new EmulationBackend(rpcProvider);

onmessage = messageEvent => rpcProvider.dispatch(messageEvent.data);
emulationBackend.startup();
