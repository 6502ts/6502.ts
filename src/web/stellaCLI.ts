import StellaCLI from '../cli/StellaCLI';
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

export function run({
        fileBlob,
        terminalElt,
        interruptButton,
        clearButton,
        cartridgeFile,
        canvas,
        cartridgeFileInput,
        cartridgeFileInputLabel
    }: {
        fileBlob: PrepackagedFilesystemProvider.BlobInterface,
        terminalElt: JQuery,
        interruptButton: JQuery,
        clearButton: JQuery,
        canvas: JQuery
        cartridgeFile?: string
        cartridgeFileInput?: JQuery
        cartridgeFileInputLabel?: JQuery
    }
) {
    const fsProvider = new PrepackagedFilesystemProvider(fileBlob),
        cli = new StellaCLI(fsProvider, cartridgeFile),
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
    element.keydown((e: JQueryKeyEventObject) => {
        switch (e.which) {
            case 17: // left ctrl
                e.preventDefault();
                return controlPanel.getSelectSwitch().toggle(true);

            case 18: // left alt
                e.preventDefault();
                return controlPanel.getResetButton().toggle(true);

            case 65: // a
                e.preventDefault();
                return joystick0.getLeft().toggle(true);

            case 68: // d
                e.preventDefault();
                return joystick0.getRight().toggle(true);

            case 83: // s
                e.preventDefault();
                return joystick0.getDown().toggle(true);

            case 87: // w
                e.preventDefault();
                return joystick0.getUp().toggle(true);

            case 86: // v
            case 32: // space
                e.preventDefault();
                return joystick0.getFire().toggle(true);
        }
    });

    element.keyup((e: JQueryKeyEventObject) => {
        switch (e.which) {
            case 17: // left ctrl
                e.preventDefault();
                return controlPanel.getSelectSwitch().toggle(false);

            case 18: // left alt
                e.preventDefault();
                return controlPanel.getResetButton().toggle(false);

            case 65: // a
                e.preventDefault();
                return joystick0.getLeft().toggle(false);

            case 68: // d
                e.preventDefault();
                return joystick0.getRight().toggle(false);

            case 83: // s
                e.preventDefault();
                return joystick0.getDown().toggle(false);

            case 87: // w
                e.preventDefault();
                return joystick0.getUp().toggle(false);

            case 86: // v
            case 32: // space
                e.preventDefault();
                return joystick0.getFire().toggle(false);
        }
    });
}
