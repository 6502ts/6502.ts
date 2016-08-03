import VideoEndpointInterface from './VideoEndpointInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';

export default class SimpleCanvasVideo {

    constructor(
        private _canvas: HTMLCanvasElement
    ) {
        this._context = this._canvas.getContext('2d');
    }

    init(): void {
        this._clearCanvas();
    }

    bind(video: VideoEndpointInterface): void {
        if (this._video) {
            return;
        }

        this._video = video;

        this._canvas.width = this._video.getWidth();
        this._canvas.height = this._video.getHeight();
        this._clearCanvas();

        this._video.newFrame.addHandler(SimpleCanvasVideo._frameHandler, this);
    }

    unbind(): void {
        if (!this._video) {
            return;
        }

        this._video.newFrame.removeHandler(SimpleCanvasVideo._frameHandler, this);
        this._video = null;

        this._clearCanvas();
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: SimpleCanvasVideo): void {
        self._context.putImageData(imageDataPoolMember.get(), 0, 0);

        imageDataPoolMember.release();
    }

    private _clearCanvas(): void {
        this._context.fillStyle = 'solid black';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    private _context: CanvasRenderingContext2D;
    private _video: VideoEndpointInterface = null;
}
