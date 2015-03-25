'use strict'

import PoolMemberInterface = require('./PoolMemberInterface');
import EventInterface = require('../event/EventInterface');

interface PoolInterface<T> {

    get(): PoolMemberInterface<T>;

    event: {
        recycle: EventInterface<T>;
        dispose: EventInterface<T>;
    }

}

export = PoolInterface;
