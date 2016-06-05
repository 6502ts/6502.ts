import StellaCLI from "../cli/StellaCLI";
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';
import ObjectPool from "../tools/pool/Pool";
import ObjectPoolMember from '../tools/pool/PoolMemberInterface';
import Surface from '../tools/surface/CanvasImageDataSurface';
import VideoOutputInterface from '../machine/io/VideoOutputInterface';
import ControlPanelInterface from '../machine/stella/ControlPanelInterface';
import DigitalJoystickInterface from '../machine/io/DigitalJoystickInterface';

export function run({
        fileBlob,
        terminalElt,
        interruptButton,
        clearButton,
        cartridgeFile,
        canvas
    }: {
        fileBlob: PrepackagedFilesystemProvider.BlobInterface,
        terminalElt: JQuery,
        interruptButton: JQuery,
        clearButton: JQuery,
        canvas: JQuery
        cartridgeFile?: string
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
        context = canvasElt.getContext('2d');

    context.fillStyle = 'solid black';
    context.fillRect(0, 0, canvasElt.width, canvasElt.height);

    cli.hardwareInitialized.addHandler(() => {
        setupVideo(canvas.get(0) as HTMLCanvasElement, cli.getVideoOutput());
        setupKeyboardControls(
            canvas,
            cli.getControlPanel(),
            cli.getJoystick0(),
            cli.getJoystick1()
        );
    });

    runner.startup();
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
    canvas.height = height;

    context.fillStyle = 'solid black';
    context.fillRect(0, 0, width, height);

    video.setSurfaceFactory((): Surface => {
        const member = surfacePool.get(),
            surface = member.get();

        poolMembers.set(surface, member);

        return surface;
    });

    video.newFrame.addHandler((surface: Surface) => {
        const poolMember = poolMembers.get(surface);

        context.putImageData(surface.getImageData(), 0, 0);

        if (poolMember) {
            poolMember.release();
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
