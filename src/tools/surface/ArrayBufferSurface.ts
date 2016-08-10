import RGBASurfaceInterface from './RGBASurfaceInterface';

class ArrayBufferSurface implements RGBASurfaceInterface {

    constructor(
        private _width: number,
        private _height: number,
        private _underlyingBuffer: ArrayBuffer
    ) {
        if (this._underlyingBuffer.byteLength !== this._width * this._height * 4) {
            throw new Error('invalid underlying buffer: size mismatch');
        }

        this._buffer = new Uint32Array(this._underlyingBuffer);
    }

    getUnderlyingBuffer(): ArrayBuffer {
        return this._underlyingBuffer;
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

    private _buffer: Uint32Array;
}

export default ArrayBufferSurface;
