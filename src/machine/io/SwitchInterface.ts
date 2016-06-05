import EventInterface from '../../tools/event/EventInterface';

interface SwitchInterface {
    toggle(state: boolean): void;
    read(): boolean;

    stateChanged: EventInterface<boolean>;
}

export default SwitchInterface;
