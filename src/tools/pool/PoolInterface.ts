import PoolMemberInterface from './PoolMemberInterface';
import EventInterface from '../event/EventInterface';

interface PoolInterface<T> {

    get(): PoolMemberInterface<T>;

    event: {
        release: EventInterface<T>;
        dispose: EventInterface<T>;
    };

}

export default PoolInterface;
