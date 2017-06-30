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

import StellaCLI from '../cli/stella/StellaCLI';
import Board from '../machine/stella/Board';
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';
import SimpleCanvasVideoDriver from './driver/SimpleCanvasVideo';
import KeyboardIoDriver from './stella/driver/KeyboardIO';
import WebAudioDriver from './stella/driver/WebAudio';
import FullscreenVideoDriver from './driver/FullscreenVideo';
import PaddleInterface from '../machine/io/PaddleInterface';
import MouseAsPaddleDriver from './driver/MouseAsPaddle';
import VideoEndpoint from './driver/VideoEndpoint';

interface PageConfig {
    cartridge?: string;
    tvMode?: string;
    audio?: string;
    paddles?: string;
    seed?: string;
}

export function run({
        fileBlob,
        terminalElt,
        interruptButton,
        clearButton,
        canvas,
        pageConfig,
        cartridgeFileInput,
        cartridgeFileInputLabel
    }: {
        fileBlob: PrepackagedFilesystemProvider.BlobInterface,
        terminalElt: JQuery,
        interruptButton: JQuery,
        clearButton: JQuery,
        canvas: JQuery
        pageConfig: PageConfig,
        cartridgeFileInput?: JQuery
        cartridgeFileInputLabel?: JQuery
    }
) {
    const fsProvider = new PrepackagedFilesystemProvider(fileBlob),
        cli = new StellaCLI(fsProvider),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton,
            clearButton
        });

    cli.allowQuit(false);

    const canvasElt = canvas.get(0) as HTMLCanvasElement,
        context = canvasElt.getContext('2d');

    context.fillStyle = 'solid black';
    context.fillRect(0, 0, canvasElt.width, canvasElt.height);

    cli.hardwareInitialized.addHandler(() => {
        const board = cli.getBoard(),
            videoDriver = setupVideo(canvas.get(0) as HTMLCanvasElement, board),
            fullscreenDriver = new FullscreenVideoDriver(videoDriver);

        setupAudio(board);
        setupKeyboardControls(
            canvas,
            board,
            fullscreenDriver
        );
        setupPaddles(board.getPaddle(0));

        board.setAudioEnabled(true);
    });

    runner.startup();

    if (cartridgeFileInput) {
        setupCartridgeReader(cli, cartridgeFileInput, cartridgeFileInputLabel);
    }

    if (pageConfig) {
        if (pageConfig.tvMode) {
            cli.pushInput(`tv-mode ${pageConfig.tvMode}\n`);
        }

        if (pageConfig.audio) {
            cli.pushInput(`audio ${pageConfig.audio}\n`);
        }

        if (pageConfig.cartridge) {
            cli.pushInput(`load-cartridge ${pageConfig.cartridge}\n`);
        }

        if (pageConfig.paddles) {
            cli.pushInput(`paddles ${pageConfig.paddles}\n`);
        }

        if (pageConfig.seed) {
            cli.pushInput(`seed ${pageConfig.seed}\n`);
        }
    }
}

function setupCartridgeReader(
    cli: StellaCLI,
    cartridgeFileInput: JQuery,
    cartridgeFileInputLabel?: JQuery
): void {

    const onCliStateChange: () => void =
        cartridgeFileInputLabel ?
            ()  => (
                cli.getState() === StellaCLI.State.setup ?
                cartridgeFileInputLabel.show() :
                cartridgeFileInputLabel.hide())
            :
            () => undefined;

    cli.events.stateChanged.addHandler(onCliStateChange);
    onCliStateChange();

    cartridgeFileInput.change(e => {
        const files = (e.currentTarget as HTMLInputElement).files;

        if (files.length !== 1) {
            return;
        }

        const reader = new FileReader(),
            file = files[0];
        reader.addEventListener('load', () => {
            if (cli.getState() !== StellaCLI.State.setup) {
                return;
            }

            cli.loadCartridgeFromBuffer(new Uint8Array(reader.result), file.name);
        });

        reader.readAsArrayBuffer(files[0]);
    });
}

function setupVideo(canvas: HTMLCanvasElement, board: Board): SimpleCanvasVideoDriver {
    const driver = new SimpleCanvasVideoDriver(canvas);
    driver.init();
    driver.bind(new VideoEndpoint(board.getVideoOutput()));

    return driver;
}

function setupAudio(board: Board) {
    const driver = new WebAudioDriver();

    try {
        driver.init();
    } catch (e) {
        console.log(`audio unavailable: ${e.message}`);
    }

    driver.bind(board.getAudioOutput());
}

function setupKeyboardControls(
    element: JQuery,
    board: Board,
    fullscreenDriver: FullscreenVideoDriver
) {
    const ioDriver = new KeyboardIoDriver(element.get(0));
    ioDriver.bind(board.getJoystick0(), board.getJoystick1(), board.getControlPanel());

    ioDriver.toggleFullscreen.addHandler(() => fullscreenDriver.toggle());
}

function setupPaddles(paddle0: PaddleInterface): void {
    const paddleDriver = new MouseAsPaddleDriver();
    paddleDriver.bind(paddle0);
}
