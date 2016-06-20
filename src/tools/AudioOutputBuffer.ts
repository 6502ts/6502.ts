class AudioOutputBuffer {

    constructor(private _content: Float32Array) {}

    getLength(): number {
        return this._content.length;
    }

    getContent(): Float32Array {
        return this._content;
    }

}

export default AudioOutputBuffer;
