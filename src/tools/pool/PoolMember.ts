import PoolMemberInterface from './PoolMemberInterface';

class PoolMember<T> implements PoolMemberInterface<T> {

    constructor(
        private _value: T,
        private _releaseCB: (victim: PoolMember<T>) => void,
        private _disposeCB: (victim: PoolMember<T>) => void
    ) {}

    get(): T {
        return this._value;
    }

    release(): void {
        this._releaseCB(this);
    }

    dispose(): void {
        this._disposeCB(this);
    }

    public _isAvailable = false;
    public _isDisposed = false;
    public _poolPosition: number;
}

export default PoolMember;
