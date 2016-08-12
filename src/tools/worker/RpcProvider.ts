import RpcProviderInterface from './RpcProviderInterface';
import Event from '../event/Event';{}

const MSG_RESOLVE_TRANSACTION = "resolve_transaction",
    MSG_REJECT_TRANSACTION = "reject_transaction",
    MSG_ERROR = "error";

enum MessageType {
    signal,
    rpc,
    internal
};

interface Transaction {
    id: number;
    resolve(result: any): void;
    reject(error: string): void;
}

interface Message {
    type: MessageType;
    transactionId?: number;
    id: string;
    payload?: any;
    transfer?: any;
}

class RpcProvider implements RpcProviderInterface {

    constructor(
        private _dispatch: RpcProvider.Dispatcher
    ) {}

    dispatch(payload: any): void {
        const message = payload as Message;

        switch (message.type) {
            case MessageType.signal:
                return this._handleSignal(message);

            case MessageType.rpc:
                return this._handeRpc(message);

            case MessageType.internal:
                return this._handleInternal(message);

            default:
                this._raiseError(`invalid message type ${message.type}`);
        }
    }

    rpc<T, U>(id: string, payload?: T, transfer?: any): Promise<U> {
        const transactionId = this._nextTransactionId++;

        this._dispatch({
            type: MessageType.rpc,
            transactionId,
            id,
            payload,
            transfer
        }, transfer ? [transfer] : undefined);

        return new Promise(
            (resolve, reject) => this._pendingTransactions[transactionId] = {
                id: transactionId,
                resolve,
                reject
            }
        );
    };

    signal<T>(id: string, payload?: T, transfer?: any): void {
        this._dispatch({
            type: MessageType.signal,
            id,
            payload,
            transfer
        }, transfer ? [transfer] : undefined);
    }

    registerRpcHandler<T, U>(id: string, handler: RpcProviderInterface.RpcHandler<T, U>): this {
        if (this._rpcHandlers[id]) {
            throw new Error(`rpc handler for ${id} already registered`);
        }

        this._rpcHandlers[id] = handler;

        return this;
    };

    registerSignalHandler <T>(id: string, handler: RpcProviderInterface.SignalHandler<T>): this {
        if (!this._signalHandlers[id]) {
            this._signalHandlers[id] = [];
        }

        this._signalHandlers[id].push(handler);

        return this;
    }

    private _raiseError(error: string): void {
        this.error.dispatch(new Error(error));

        this._dispatch({
            type: MessageType.internal,
            id: MSG_ERROR,
            payload: error
        });
    }

    private _handleSignal(message: Message): void {
        if (!this._signalHandlers[message.id]) {
            return this._raiseError(`invalid signal ${message.id}`);
        }

        this._signalHandlers[message.id].forEach(handler => handler(message.payload, message.transfer));
    }

    private _handeRpc(message: Message): void {
        if (!this._rpcHandlers[message.id]) {
            return this._raiseError(`invalid rpc ${message.id}`);
        }

        Promise.resolve(this._rpcHandlers[message.id](message.payload, message.transfer))
            .then(
                (result: any) => this._dispatch({
                    type: MessageType.internal,
                    id: MSG_RESOLVE_TRANSACTION,
                    transactionId: message.transactionId,
                    payload: result
                }),
                (reason: string) => this._dispatch({
                    type: MessageType.internal,
                    id: MSG_REJECT_TRANSACTION,
                    transactionId: message.transactionId,
                    payload: reason
                })
            );
    }

    private _handleInternal(message: Message): void {
        switch (message.id) {
            case MSG_RESOLVE_TRANSACTION:
                if (!this._pendingTransactions[message.transactionId]) {
                    return this._raiseError(`no pending transaction with id ${message.transactionId}`);
                }

                this._pendingTransactions[message.transactionId].resolve(message.payload);
                delete this._pendingTransactions[message.transactionId];

                break;

            case MSG_RESOLVE_TRANSACTION:
                if (!this._pendingTransactions[message.transactionId]) {
                    return this._raiseError(`no pending transaction with id ${message.transactionId}`);
                }

                this._pendingTransactions[message.transactionId].reject(message.payload);
                delete this._pendingTransactions[message.transactionId];

                break;

            case MSG_ERROR:
                this.error.dispatch(new Error(`remote error: ${message.payload}`));
                break;

            default:
                this._raiseError(`unhandled internal message ${message.id}`);
                break;
        }
    }

    error = new Event<Error>();

    private _rpcHandlers: {[id: string]: RpcProviderInterface.RpcHandler<any, any>} = {};
    private _signalHandlers: {[id: string]: Array<RpcProviderInterface.SignalHandler<any>>} = {};
    private _pendingTransactions: {[id: number]: Transaction} = {};

    private _nextTransactionId = 0;
}

module RpcProvider {

    export interface Dispatcher {
        (message: Message, transfer?: Array<any>): void;
    }

}

export default RpcProvider;
