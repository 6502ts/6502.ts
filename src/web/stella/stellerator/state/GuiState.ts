class GuiState implements Changeset {

    constructor(changes?: Changeset, old?: GuiState) {
        Object.assign(this, old, changes);
    }

    readonly mode = GuiState.GuiMode.cartridgeList;

    readonly showSelectPendingChangesModal = false;
    readonly pendingSelectHash = '';

    readonly showLoadPendingChangesModal = false;
    readonly pendingLoad: Uint8Array;
    readonly pendingLoadName: string;

}

module GuiState {

    export enum GuiMode {
        cartridgeList,
        run
    }

}

interface Changeset {
    mode?: GuiState.GuiMode;
    showSelectPendingChangesModal?: boolean;
    pendingSelectHash?: string;
    showLoadPendingChangesModal?: boolean;
    pendingLoad?: Uint8Array;
    pendingLoadName?: string;
}

export default GuiState;
