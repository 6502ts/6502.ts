interface PoolMemberInterface<T> {

    get(): T;

    release(): void;

    dispose(): void;

}

export default PoolMemberInterface;
