import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default class EmulationState implements Changeset {

    constructor(changes?: Changeset, old?: EmulationState) {
        Object.assign(this, old, changes);
    }

    cartridgeHash = '';
    emulationState = EmulationServiceInterface.State.stopped;

    difficultyPlayer0 = true;
    difficultyPlayer1 = true;
    tvMode = false;

    enforceRateLimit = true;

    frequency = 0;
    gamepadCount = 0;
}

interface Changeset {
    cartridgeHash?: string;
    emulationState?: EmulationServiceInterface.State;

    difficultyPlayer0?: boolean;
    difficultyPlayer1?: boolean;
    tvMode?: boolean;

    enforceRateLimit?: boolean;

    frequency?: number;
    gamepadCount?: number;
}
