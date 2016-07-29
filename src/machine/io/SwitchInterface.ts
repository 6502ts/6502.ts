import EventInterface from '../../tools/event/EventInterface';

interface SwitchInterface {
    toggle(state: boolean): void;
    read(): boolean;
    peek(): boolean;

    stateChanged: EventInterface<boolean>;
    beforeRead: EventInterface<SwitchInterface>;
}

export default SwitchInterface;
