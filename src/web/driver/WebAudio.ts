declare const webkitAudioContext: any;

import AudioOutputInterface from '../../machine/io/AudioOutputInterface';

export default class WebAudioDriver {

    constructor(channels: number) {
        this._channels = new Array<Channel>(channels);

        for (let i = 0; i < channels; i++) {
            this._channels[i] = new Channel(this._cache);
        }
    }

    init(): void {
        const ctor: (typeof AudioContext) = AudioContext || webkitAudioContext;

        if (!ctor) {
            throw new Error(`web audio is not supported by runtime`);
        }

        this._context = new ctor();
        this._context.destination.channelCount = 1;

        this._merger = this._context.createChannelMerger(this._channels.length);
        this._merger.connect(this._context.destination);

        this._channels.forEach(channel => channel.init(this._context, this._merger));
    }

    bind(...sources: Array<AudioOutputInterface>): void {
        if (this._sources) {
            return;
        }

        if (sources.length !== this._channels.length) {
            throw new Error(`invalid number of sources: got ${sources.length}, expected ${this._channels.length}`);
        }

        this._sources = sources;

        for (let i = 0; i < this._sources.length; i++) {
            this._channels[i].bind(this._sources[i]);
        }
    }

    unbind(): void {
        if (!this._sources) {
            return;
        }

        this._channels.forEach(channel => channel.unbind());

        this._sources = null;
    }

    private _context: AudioContext = null;
    private _merger: ChannelMergerNode = null;
    private _channels: Array<Channel> = null;
    private _sources: Array<AudioOutputInterface> = null;
    private _cache: BufferCache = {};

}

class Channel{


    constructor(
        private _cache: BufferCache
    ) {}

    init(context: AudioContext, target: AudioNode): void {
        this._context = context;

        this._gain = this._context.createGain();
        this._gain.connect(target);
    }

    bind(target: AudioOutputInterface): void {
        if (this._audio) {
            return;
        }

        this._audio = target;
        this._gain.gain.value = this._audio.getVolume();

        this._audio.volumeChanged.addHandler(Channel._onVolumeChanged, this);
        this._audio.bufferChanged.addHandler(Channel._onBufferChanged, this);
        this._audio.stop.addHandler(Channel._onStop, this);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._audio.volumeChanged.removeHandler(Channel._onVolumeChanged, this);
        this._audio.bufferChanged.removeHandler(Channel._onBufferChanged, this);
        this._audio.stop.removeHandler(Channel._onStop, this);

        if (this._source) {
            this._source.stop();
            this._source = null;
        }

        this._audio = null;
    }

    private static _onVolumeChanged(volume: number, self: Channel): void {
        self._gain.gain.value = volume;
    }

    private static _onBufferChanged(key: number, self: Channel): void {
        if (!self._cache[key]) {
            const buffer = self._audio.getBuffer(key),
                audioBuffer = self._context.createBuffer(1, buffer.getLength(), buffer.getSampleRate());

            audioBuffer.getChannelData(0).set(buffer.getContent());
            self._cache[key] = audioBuffer;
        }

        const buffer = self._cache[key],
            source = self._context.createBufferSource();


        if (self._source) {
            self._source.stop();
        }

        source.loop = true;
        source.buffer = buffer;
        source.connect(self._gain);
        source.start();

        self._source = source;
    }

    private static _onStop(payload: void, self: Channel): void {
        if (self._source) {
            self._source.stop();
            self._source = null;
        }
    }

    private _context: AudioContext = null;
    private _source: AudioBufferSourceNode = null;
    private _gain: GainNode = null;
    private _audio: AudioOutputInterface = null;

}

interface BufferCache {
    [key: number]: AudioBuffer;
}
