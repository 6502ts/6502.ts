import VideoOutputInterface from '../..//machine/io/VideoOutputInterface';
import ObjectPool from '../../tools/pool/Pool';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import Event from '../../tools/event/Event';
import ArrayBufferSurface from '../../tools/surface/ArrayBufferSurface';
import RGBASurfaceInterface from '../../tools/surface/RGBASurfaceInterface';
import VideoEndpointInterface from '../driver/VideoEndpointInterface';

class VideoEndpoint implements VideoEndpointInterface {

    constructor(
        private _video: VideoOutputInterface
    ) {
        this._pool = new ObjectPool<ImageData>(
            () => new ImageData(this._video.getWidth(), this._video.getHeight())
        );

        this._video.setSurfaceFactory(
            (): RGBASurfaceInterface => {
                const poolMember = this._pool.get(),
                    imageData = poolMember.get();

                if (!this._surfaces.has(imageData)) {
                    const newSurface = new ArrayBufferSurface(imageData.width, imageData.height, imageData.data.buffer);

                    this._surfaces.set(
                        imageData,
                        newSurface.fill(0xFF000000)
                    );
                }

                const surface = this._surfaces.get(imageData);

                this._poolMembers.set(surface, poolMember);

                return surface;
            }
        );

        this._video.newFrame.addHandler(
            surface => this.newFrame.dispatch(this._poolMembers.get(surface))
        );
    }

    getWidth(): number {
        return this._video.getWidth();
    }

    getHeight(): number {
        return this._video.getHeight();
    }

    newFrame = new Event<PoolMemberInterface<ImageData>>();

    private _pool: ObjectPool<ImageData>;
    private _poolMembers = new WeakMap<RGBASurfaceInterface, PoolMemberInterface<ImageData>>();
    private _surfaces = new WeakMap<ImageData, RGBASurfaceInterface>();
}

export default VideoEndpoint;
