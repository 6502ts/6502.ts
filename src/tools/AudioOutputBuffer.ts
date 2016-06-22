class AudioOutputBuffer {

    constructor(
        private _content: Float32Array,
        private _sampleRate: number
    ) {}

    getLength(): number {
        return this._content.length;
    }

    getContent(): Float32Array {
        return this._content;
    }

    getSampleRate(): number {
        return this._sampleRate;
    }

}

export default AudioOutputBuffer;
