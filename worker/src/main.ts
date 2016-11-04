declare function postMessage(message: any, transfer?: any): void;

import {RpcProvider} from 'worker-rpc';
import EmulationBackend from '../../src/web/stella/service/worker/EmulationBackend';

const rpcProvider = new RpcProvider(
        (message, transfer?) => postMessage(message, transfer)
    ),
    emulationBackend = new EmulationBackend(rpcProvider);

rpcProvider.error.addHandler(e => console.log(e ? e.message : 'unknown rpc error'));

onmessage = messageEvent => rpcProvider.dispatch(messageEvent.data);
emulationBackend.startup();
