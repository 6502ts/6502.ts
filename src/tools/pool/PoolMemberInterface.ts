'use strict';

interface PoolMemberInterface<T> {

    get(): T;

    release(): void;

    dispose(): void;

}

export = PoolMemberInterface;
