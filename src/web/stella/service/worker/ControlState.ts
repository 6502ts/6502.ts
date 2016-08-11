interface ControlState {
    joystickState: Array<ControlState.JoystickState>;
    paddleState: Array<ControlState.PaddleState>;
    controlPanelState: ControlState.ControlPanelState;
}

module ControlState {

    export interface JoystickState {
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        fire: boolean;
    }

    export interface PaddleState {
        value: number;
        fire: boolean;
    }

    export interface ControlPanelState {
        difficulty0: boolean;
        difficulty1: boolean;
        select: boolean;
        reset: boolean;
        color: boolean;
    }

}

export default ControlState;
