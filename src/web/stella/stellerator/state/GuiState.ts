class GuiState {

    constructor(
        public mode = GuiState.GuiMode.cartridgeList,
        public showDiscardChangesModel: boolean = false,
        public pendingSelectHash: string = ''
    ) {}

}

module GuiState {

    export enum GuiMode {
        cartridgeList,
        run
    }

}


export default GuiState;
