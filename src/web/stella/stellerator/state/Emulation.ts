import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default class EmulationState implements Changeset {

    constructor(changes?: Changeset, old?: EmulationState) {
        Object.assign(this, old, changes);
    }

    readonly cartridgeHash = '';
    readonly emulationState = EmulationServiceInterface.State.stopped;

    readonly difficultyPlayer0 = true;
    readonly difficultyPlayer1 = true;
    readonly tvMode = false;

    readonly enforceRateLimit = true;

    readonly frequency = 0;
    readonly gamepadCount = 0;

    readonly pausedByUser = false;
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

    pausedByUser?: boolean;
}
