import StellaCLI from '../cli/stella/StellaCLI';
import Board from '../machine/stella/Board';
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';
import SimpleCanvasVideoDriver from './driver/SimpleCanvasVideo';
import KeyboardIoDriver from './stella/driver/KeyboardIO';
import WebAudioDriver from './stella/driver/WebAudio';
import PaddleInterface from '../machine/io/PaddleInterface';

interface PageConfig {
    cartridge?: string;
    tvMode?: string;
    audio?: string;
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
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    cli.allowQuit(false);

    const canvasElt = canvas.get(0) as HTMLCanvasElement,
        context = canvasElt.getContext('2d');

    context.fillStyle = 'solid black';
    context.fillRect(0, 0, canvasElt.width, canvasElt.height);

    cli.hardwareInitialized.addHandler(() => {
        const board = cli.getBoard();

        setupVideo(canvas.get(0) as HTMLCanvasElement, board);
        setupAudio(board);
        setupKeyboardControls(
            canvas,
            board
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
    }

    window.addEventListener('resize', () => resizeForFullscreenIfApplicable(canvas));
}

function setupCartridgeReader(
    cli: StellaCLI,
    cartridgeFileInput: JQuery,
    cartridgeFileInputLabel?: JQuery
): void {

    const onCliStateChange: () => void =
        cartridgeFileInputLabel ?
        ()  => (cli.getState() === StellaCLI.State.setup ? cartridgeFileInputLabel.show() : cartridgeFileInputLabel.hide()) :
        () => undefined;

    cli.events.stateChanged.addHandler(onCliStateChange);
    onCliStateChange();

    cartridgeFileInput.change((e: JQueryInputEventObject) => {
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

function setupVideo(canvas: HTMLCanvasElement, board: Board) {
    const driver = new SimpleCanvasVideoDriver(canvas);
    driver.init();
    driver.bind(board.getVideoOutput());
}

function setupAudio(board: Board) {
    const driver = new WebAudioDriver();

    try {
        driver.init();
    } catch (e) {
        console.log(`audio unavailable: ${e.message}`);
    }

    driver.bind(board);
}

function setupKeyboardControls(
    element: JQuery,
    board: Board
) {
    const ioDriver = new KeyboardIoDriver(element.get(0));
    ioDriver.bind(board);

    ioDriver.toggleFullscreen.addHandler(() => {
        if (fullscreenActive()) {
            exitFullscreen();
        } else {
            enterFullscreen(element);
        }
    });
}

function setupPaddles(paddle0: PaddleInterface): void {
    let x = -1;

    document.addEventListener('mousemove', (e: MouseEvent) => {
        if (x >= 0) {
            const dx = e.screenX - x;
            let value = paddle0.getValue();

            value += -dx / window.innerWidth / 0.9;
            if (value < 0) value = 0;
            if (value > 1) value = 1;

            paddle0.setValue(value);
        }

        x = e.screenX;
    });
}

function enterFullscreen(elt: JQuery) {
    const unwrapped: any = elt.get(0),
        requestFullscreen: () => void =
            unwrapped.requestFullscreen ||
            unwrapped.webkitRequestFullScreen ||
            unwrapped.webkitRequestFullscreen ||
            unwrapped.mozRequestFullscreen ||
            unwrapped.mozRequestFullScreen ||
            unwrapped.msRequestFullscreen ||
            unwrapped.msRequestFullScreen;

    if (requestFullscreen) {
        requestFullscreen.apply(unwrapped);
    }
}

function exitFullscreen() {
    const doc: any = document,
        exitFullscreen =
            doc.exitFullscreen ||
            doc.webkitExitFullScreen ||
            doc.webkitExitFullscreen ||
            doc.mozExitFullscreen ||
            doc.mozExitFullScreen ||
            doc.msRequestFullscreen ||
            doc.msRequestFullScreen;

    if (exitFullscreen) {
        exitFullscreen.apply(doc);
    }
}

function fullscreenActive() {
    const doc = document as any;

    return  doc.fullscreen ||
            doc.webkitIsFullScreen ||
            doc.webkitIsFullscreen ||
            doc.mozFullscreen ||
            doc.mozFullScreen ||
            !!doc.msFullsceenElement;
}

function resizeForFullscreenIfApplicable(canvas: JQuery) {
    if (!fullscreenActive()) {
        canvas.removeAttr('style');
        return;
    }

    const actualWidth = window.innerWidth,
        actualHeight = window.innerHeight;

    let correctedWidth: number, correctedHeight: number;

    if (actualWidth > actualHeight) {
        correctedHeight = actualHeight;
        correctedWidth = actualHeight / 3 * 4;
    } else {
        correctedWidth = actualWidth;
        correctedHeight = actualHeight / 4 * 3;
    }

    canvas.css({
        width: correctedWidth,
        height: correctedHeight
    });
}
