import StellaCLI from '../cli/stella/StellaCLI';
import Board from '../machine/stella/Board';
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';
import ObjectPool from '../tools/pool/Pool';
import ObjectPoolMember from '../tools/pool/PoolMemberInterface';
import Surface from '../tools/surface/CanvasImageDataSurface';
import VideoOutputInterface from '../machine/io/VideoOutputInterface';
import ControlPanelInterface from '../machine/stella/ControlPanelInterface';
import DigitalJoystickInterface from '../machine/io/DigitalJoystickInterface';
import AudioOutputBuffer from '../tools/AudioOutputBuffer';
import SwitchInterface from '../machine/io/SwitchInterface';

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
        context = canvasElt.getContext('2d'),
        audioContext = new AudioContext();

    context.fillStyle = 'solid black';
    context.fillRect(0, 0, canvasElt.width, canvasElt.height);

    audioContext.destination.channelCount = 1;

    cli.hardwareInitialized.addHandler(() => {
        const board = cli.getBoard();

        setupVideo(canvas.get(0) as HTMLCanvasElement, board.getVideoOutput());
        setupAudio(audioContext, board.getAudioOutput());
        setupKeyboardControls(
            canvas,
            board.getControlPanel(),
            board.getJoystick0(),
            board.getJoystick1()
        );

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

function setupVideo(canvas: HTMLCanvasElement, video: VideoOutputInterface) {
    const width = video.getWidth(),
        height = video.getHeight(),
        context = canvas.getContext('2d'),
        poolMembers = new WeakMap<Surface, ObjectPoolMember<Surface>>(),
        surfacePool = new ObjectPool<Surface>(
            () => new Surface(width, height, context)
        );

    canvas.width = width;
    canvas.height = height + 5;

    context.fillStyle = 'solid black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    video.setSurfaceFactory((): Surface => {
        const member = surfacePool.get(),
            surface = member.get();

        poolMembers.set(surface, member);

        return surface;
    });

    video.newFrame.addHandler((surface: Surface) => {
        const poolMember = poolMembers.get(surface);

        context.putImageData(surface.getImageData(), 0, 5);

        if (poolMember) {
            poolMember.release();
        }
    });
}

function setupAudio(context: AudioContext, audio: Board.Audio) {

    let source0: AudioBufferSourceNode;
    let source1: AudioBufferSourceNode;

    const merger = context.createChannelMerger(2);
    merger.connect(context.destination);

    audio.channel0.bufferChanged.addHandler((outputBuffer: AudioOutputBuffer) => {
        const buffer = context.createBuffer(1, outputBuffer.getLength(), 44100);
        buffer.getChannelData(0).set(outputBuffer.getContent());

        if (source0) {
            source0.stop();
        }

        source0 = context.createBufferSource();
        source0.loop = true;
        source0.buffer = buffer;
        source0.connect(merger);
        source0.start();
    });

    audio.channel0.stop.addHandler(() => {
        if (source0) {
            source0.stop();
            source0 = null;
        }
    });

    audio.channel1.bufferChanged.addHandler((outputBuffer: AudioOutputBuffer) => {
        const buffer = context.createBuffer(1, outputBuffer.getLength(), 44100);
        buffer.getChannelData(0).set(outputBuffer.getContent());

        if (source1) {
            source1.stop();
        }

        source1 = context.createBufferSource();
        source1.loop = true;
        source1.buffer = buffer;
        source1.connect(merger);
        source1.start();
    });

    audio.channel1.stop.addHandler(() => {
        if (source1) {
            source1.stop();
            source1 = null;
        }
    });
}

function setupKeyboardControls(
    element: JQuery,
    controlPanel: ControlPanelInterface,
    joystick0: DigitalJoystickInterface,
    joystick1: DigitalJoystickInterface
) {
    const mappings: {[key: string]: SwitchInterface} = {
        17: controlPanel.getSelectSwitch(),     // l-alt
        18: controlPanel.getResetButton(),      // l-ctrl
        65: joystick0.getLeft(),                // w
        37: joystick0.getLeft(),                // left
        68: joystick0.getRight(),               // d
        39: joystick0.getRight(),               // right
        83: joystick0.getDown(),                // s
        40: joystick0.getDown(),                // down
        87: joystick0.getUp(),                  // w
        38: joystick0.getUp(),                  // up
        86: joystick0.getFire(),                // v
        32: joystick0.getFire(),                // space
        74: joystick1.getLeft(),                // j,
        76: joystick1.getRight(),               // l,
        73: joystick1.getUp(),                  // i,
        75: joystick1.getDown(),                // k
        66: joystick1.getFire(),                // b
    };

    element.keydown((e: JQueryKeyEventObject) => {
        if (mappings[e.which]) {
            mappings[e.which].toggle(true);
            e.preventDefault();

            return;
        }

        switch (e.which) {
            case 13: // enter
                if (fullscreenActive()) {
                    exitFullscreen();
                } else {
                    enterFullscreen(element);

                }
                return;
        }
    });

    element.keyup((e: JQueryKeyEventObject) => {
        if (mappings[e.which]) {
            mappings[e.which].toggle(false);
            e.preventDefault();
        }
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
