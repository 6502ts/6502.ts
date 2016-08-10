import PoolMember from './PoolMember';
import Event from '../event/Event';
import PoolInterface from './PoolInterface';

class Pool<T> implements PoolInterface<T> {

    constructor(
        private _factory: Pool.FactoryInterface<T>
    ) {}

    get(): PoolMember<T> {
        let member: PoolMember<T>;

        if (this._poolSize === 0) {
            const newItem = this._factory();

            member = newItem && new PoolMember<T>(
                newItem,
                (victim: PoolMember<T>) => this._releaseMember(victim),
                (victim: PoolMember<T>) => this._disposeMember(victim)
            );
        } else {
            member = this._pool[--this._poolSize];
            member._isAvailable = false;
        }

        return member;
    }

    event = {
        release: new Event<T>(),
        dispose: new Event<T>()
    };

    private _releaseMember(victim: PoolMember<T>) {
        if (victim._isAvailable)
            throw new Error('Trying to release an already released pool member');

        if (victim._isDisposed)
            throw new Error('Trying to release an already disposed pool member');

        const position = this._poolSize++;

        this._pool[position] = victim;

        victim._isAvailable = true;
        victim._poolPosition = position;

        this.event.release.dispatch(victim.get());
    }

    private _disposeMember(victim: PoolMember<T>) {
        if (victim._isDisposed)
            throw new Error('Trying to dispose of an already disposed pool member');

        if (victim._isAvailable) {
            if (this._poolSize > 1) {
                this._pool[victim._poolPosition] = this._pool[this._poolSize - 1];
            }

            this._poolSize--;
        }

        victim._isDisposed = true;

        this.event.dispose.dispatch(victim.get());
    }

    private _pool: Array<PoolMember<T> > = [];

    private _poolSize = 0;
}

module Pool {
    export interface FactoryInterface<T> {
        (): T;
    }

    export interface RecycleCallbackInterface<T> {
        (value: T): void;
    }

    export interface DisposeCallbackInterface<T> {
        (value: T): void;
    }
}

export default Pool;
