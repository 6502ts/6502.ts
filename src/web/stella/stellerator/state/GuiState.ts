class GuiState {

    constructor(changes?: {
        mode?: GuiState.GuiMode;
        showSelectPendingChangesModal?: boolean;
        pendingSelectHash?: string;
        showLoadPendingChangesModal?: boolean,
        pendingLoad?: Uint8Array,
        pendingLoadName?: string
    }, old?: GuiState) {
        Object.assign(this, old, changes);
    }

    public mode = GuiState.GuiMode.cartridgeList;

    public showSelectPendingChangesModal = false;
    public pendingSelectHash = '';

    public showLoadPendingChangesModal = false;
    public pendingLoad: Uint8Array;
    public pendingLoadName: string;

}

module GuiState {

    export enum GuiMode {
        cartridgeList,
        run
    }

}


export default GuiState;
