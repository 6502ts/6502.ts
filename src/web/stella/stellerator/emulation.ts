/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */


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
