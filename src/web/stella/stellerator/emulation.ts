import {Store} from 'redux';

import EmulationServiceInterface from '../service/EmulationServiceInterface';
import WorkerEmulationService from '../service/worker/EmulationService';
import VanillaEmulationService from '../service/vanilla/EmulationService';
import EmulationContextInterface from '../service/EmulationContextInterface';
import DriverManager from '../service/DriverManager';
import WebAudioDriver from '../driver/WebAudio';
import GamepadDriver from '../../driver/Gamepad';
import State from './state/State';
import {startGamepadDriverDispatcher} from './dispatchers';

export function init(store: Store<State>, workerUrl?: string): Promise<EmulationServiceInterface> {
    const emulationService = (workerUrl && store.getState().settings.useWorker) ?
        new WorkerEmulationService(workerUrl) :
        new VanillaEmulationService();

    return emulationService
        .init()
        .then(() => {
            const driverManager = new DriverManager();

            initAudio(emulationService, driverManager);
            initGamepad(emulationService, driverManager, store);

            driverManager.bind(emulationService);

            return emulationService;
        });
}

function initAudio(emulationService: EmulationServiceInterface, driverManager: DriverManager): void {
    const audioDriver = new WebAudioDriver();

    try {
        audioDriver.init();
        driverManager.addDriver(
            audioDriver,
            (context: EmulationContextInterface, driver: WebAudioDriver) => driver.bind(context.getAudio())
        );
    } catch (e) {
        console.log(`audio not available: ${e.message}`);
    }
}

function initGamepad(
    emulationService: EmulationServiceInterface,
    driverManager: DriverManager,
    store: Store<State>
): void {
    const gamepadDriver = new GamepadDriver();

    try {
        gamepadDriver.init();
        driverManager.addDriver(
            gamepadDriver,
            (context: EmulationContextInterface, driver: GamepadDriver) =>
                driver.bind({
                    joysticks: [context.getJoystick(0), context.getJoystick(1)],
                    start: context.getControlPanel().getResetButton(),
                    select: context.getControlPanel().getSelectSwitch()
                })
        );

        startGamepadDriverDispatcher(gamepadDriver, store);
    } catch (e) {
        console.log(`audio not available: ${e.message}`);
    }
}
