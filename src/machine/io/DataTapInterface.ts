import { EventInterface } from 'microevent.ts';

interface DataTapInterface {
    message: EventInterface<ArrayLike<number>>;
}

export default DataTapInterface;
