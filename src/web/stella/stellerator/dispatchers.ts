import {Store} from 'redux';

import {updateGamepadCount} from './actions/emulation';
import State from './state/State';
import GamepadDriver from '../../driver/Gamepad';

export function dispatchGamepadDriver(driver: GamepadDriver, store: Store<State>): void {
    driver.gamepadCountChanged.addHandler(
        gamepadCount => store.dispatch(updateGamepadCount(gamepadCount))
    );

    store.dispatch(updateGamepadCount(driver.getGamepadCount()));
}
