import {EventInterface} from 'microevent.ts';

interface RpcProviderInterface {

    dispatch(payload: any): void;

    rpc<T, U>(id: string, payload?: T, transfer?: any): Promise<U>;

    signal<T>(id: string, payload?: T, transfer?: any): void;

    registerRpcHandler<T, U>(id: string, handler: RpcProviderInterface.RpcHandler<T, U>): this;

    registerSignalHandler<T>(id: string, handler: RpcProviderInterface.SignalHandler<T>): this;

    error: EventInterface<Error>;

}

module RpcProviderInterface {

    export interface RpcHandler<T, U> {
        (payload?: T, transfer?: any): Promise<U>|U;
    }

    export interface SignalHandler<T> {
        (payload?: T, transfer?: any): void;
    }

}

export default RpcProviderInterface;
