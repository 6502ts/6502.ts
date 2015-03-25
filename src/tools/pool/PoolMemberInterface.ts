'use strict';

interface PoolMemberInterface<T> {

    get(): T;

    recycle(): void;

    dispose(): void;

}

export = PoolMemberInterface;
