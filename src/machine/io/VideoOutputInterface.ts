'use strict';

import RGBASurfaceInterface = require('../../tools/surface/RGBASurfaceInterface');
import EventInterface = require('../../tools/event/EventInterface');

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

export = VideoOutputInterface;
