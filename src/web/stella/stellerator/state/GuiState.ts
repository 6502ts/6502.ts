class GuiState implements Changeset {

    constructor(changes?: Changeset, old?: GuiState) {
        Object.assign(this, old, changes);
    }

    mode = GuiState.GuiMode.cartridgeList;

    showSelectPendingChangesModal = false;
    pendingSelectHash = '';

    showLoadPendingChangesModal = false;
    pendingLoad: Uint8Array;
    pendingLoadName: string;

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
