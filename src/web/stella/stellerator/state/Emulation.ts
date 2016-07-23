import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default class EmulationState implements Changeset {

    constructor(changes?: Changeset, old?: EmulationState) {
        Object.assign(this, old, changes);
    }

    cartridgeHash = '';
    emulationState = EmulationServiceInterface.State.stopped;
}

interface Changeset {
    cartridgeHash?: string;
    emulationState?: EmulationServiceInterface.State;
}
