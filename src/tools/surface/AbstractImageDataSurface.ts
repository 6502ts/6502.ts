import RGBASurfaceInterface from './RGBASurfaceInterface';

abstract class AbstractImageDataSurface implements RGBASurfaceInterface {

    constructor(
        private _width: number,
        private _height: number,
        private _imageData: ImageData
    ) {
        this._buffer = new Uint32Array(this._imageData.data.buffer);
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return this._height;
    }

    getBuffer(): Uint32Array {
        return this._buffer;
    }

    getByteOrder(): RGBASurfaceInterface.ByteOrder {
        return RGBASurfaceInterface.ByteOrder.rgba;
    }

    getImageData(): ImageData {
        return this._imageData;
    }

    private _buffer: Uint32Array;
}

export default AbstractImageDataSurface;
