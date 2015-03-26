'use strict'

import PoolMemberInterface = require('./PoolMemberInterface');
import EventInterface = require('../event/EventInterface');

interface PoolInterface<T> {

    get(): PoolMemberInterface<T>;

    event: {
        release: EventInterface<T>;
        dispose: EventInterface<T>;
    }

}

export = PoolInterface;
