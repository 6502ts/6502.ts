import {EventInterface} from 'microevent.ts';

import PoolMemberInterface from './PoolMemberInterface';

interface PoolInterface<T> {

    get(): PoolMemberInterface<T>;

    event: {
        release: EventInterface<T>;
        dispose: EventInterface<T>;
    };

}

export default PoolInterface;
