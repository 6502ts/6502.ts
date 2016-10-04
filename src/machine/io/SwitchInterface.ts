import {EventInterface} from 'microevent.ts';

interface SwitchInterface {
    toggle(state: boolean): void;
    read(): boolean;
    peek(): boolean;

    stateChanged: EventInterface<boolean>;
    beforeRead: EventInterface<SwitchInterface>;
}

export default SwitchInterface;
