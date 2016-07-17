class GuiState {

    constructor(
        public mode = GuiState.GuiMode.cartridgeList
    ) {}

}

module GuiState {

    export enum GuiMode {
        cartridgeList,
        run
    }

}


export default GuiState;
