import RGBASurfaceInterface from '../../tools/surface/RGBASurfaceInterface';
import EventInterface from '../../tools/event/EventInterface';

interface VideoOutputInterface {

    getWidth(): number;

    getHeight(): number;

    setSurfaceFactory(factory: VideoOutputInterface.SurfaceFactoryInterface):
        VideoOutputInterface;

    newFrame: EventInterface<RGBASurfaceInterface>;

}

module VideoOutputInterface {

    export interface SurfaceFactoryInterface {
        (): RGBASurfaceInterface;
    }

}

export default VideoOutputInterface;
