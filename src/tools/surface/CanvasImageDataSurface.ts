import RGBASurfaceInterface from './RGBASurfaceInterface';

class CanvasImageDataSurface implements RGBASurfaceInterface {

    constructor(
        private _width: number,
        private _height: number,
        context: CanvasRenderingContext2D
    ) {
        this._imageData = context.createImageData(this._width, this._height);
        this._buffer = new Uint32Array(<ArrayBuffer>(<any>this._imageData.data).buffer);
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

    sync(): void {}

    private _imageData: ImageData;
    private _buffer: Uint32Array;
}

export default CanvasImageDataSurface;
