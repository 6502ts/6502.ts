import {EventInterface} from 'microevent.ts';

import RGBASurfaceInterface from '../../tools/surface/RGBASurfaceInterface';

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
