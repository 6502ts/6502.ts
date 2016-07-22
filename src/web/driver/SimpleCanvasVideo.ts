import ObjectPool from '../../tools/pool/Pool';
import ObjectPoolMember from '../../tools/pool/PoolMemberInterface';
import Surface from '../../tools/surface/CanvasImageDataSurface';
import VideoOutputInterface from '../../machine/io/VideoOutputInterface';

export default class SimpleCanvasVideo {

    constructor(
        private _canvas: HTMLCanvasElement
    ) {
        this._context = this._canvas.getContext('2d');
    }

    init(): void {
        this._clearCanvas();
    }

    bind(video: VideoOutputInterface): void {
        if (this._video) {
            return;
        }

        this._video = video;

        this._width = this._video.getWidth();
        this._height = this._video.getHeight();

        this._surfacePool = new ObjectPool<Surface>(
            () => new Surface(this._width, this._height, this._context)
        );

        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._clearCanvas();

        this._video.setSurfaceFactory((): Surface => {
            const member  = this._surfacePool.get(),
                surface = member.get();

            this._poolMembers.set(surface, member);

            return surface;
        });

        this._video.newFrame.addHandler(SimpleCanvasVideo._frameHandler, this);
    }

    unbind(): void {
        if (!this._video) {
            return;
        }

        this._video.setSurfaceFactory(null);
        this._video.newFrame.removeHandler(SimpleCanvasVideo._frameHandler, this);

        this._surfacePool = null;
        this._video = null;

        this._clearCanvas();
    }

    private static _frameHandler(surface: Surface, self: SimpleCanvasVideo): void {
        const poolMember = self._poolMembers.get(surface);

        self._context.putImageData(surface.getImageData(), 0, 0);

        if (poolMember) {
            poolMember.release();
        }
    }

    private _clearCanvas(): void {
        this._context.fillStyle = 'solid black';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    private _context: CanvasRenderingContext2D;
    private _poolMembers  = new WeakMap<Surface, ObjectPoolMember<Surface>>();
    private _surfacePool: ObjectPool<Surface>;
    private _width = 0;
    private _height = 0;
    private _video: VideoOutputInterface = null;
}
