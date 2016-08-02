import RGBASurfaceInterface from './RGBASurfaceInterface';
import AbstractImageDataSurface from './AbstractImageDataSurface';

class ImageDataSurface extends AbstractImageDataSurface implements RGBASurfaceInterface {

    constructor(
        width: number,
        height: number
    ) {
        super(width, height, new ImageData(width, height));
    }
}

export default ImageDataSurface;
