import RGBASurfaceInterface from './RGBASurfaceInterface';
import AbstractImageDataSurface from './AbstractImageDataSurface';

class CanvasImageDataSurface extends AbstractImageDataSurface implements RGBASurfaceInterface {

    constructor(
        width: number,
        height: number,
        context: CanvasRenderingContext2D
    ) {
        super(width, height, context.createImageData(width, height));
    }
}

export default CanvasImageDataSurface;
