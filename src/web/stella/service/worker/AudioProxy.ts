import {Event} from 'microevent.ts';

import {RpcProviderInterface} from 'worker-rpc';
import AudioOutputInterface from '../../../../machine/io/AudioOutputInterface';
import ToneGenerator from '../../../../machine/stella/tia/ToneGenerator';
import StellaConfig from '../../../../machine/stella/Config';
import AudioOutputBuffer from '../../../../tools/AudioOutputBuffer';

import {
    SIGNAL_TYPE,
    AudioBufferChangeMessage,
    AudioVolumeChangeMessage
} from './messages';

class AudioProxy implements AudioOutputInterface {

    constructor(
        private _index: number,
        private _rpc: RpcProviderInterface
    ) {}

    init(): this {
        this._rpc
            .registerSignalHandler(SIGNAL_TYPE.audioBufferChange, this._onBufferChangeSignal.bind(this))
            .registerSignalHandler(SIGNAL_TYPE.audioVolumeChange, this._onVolumeChangeSignal.bind(this))
            .registerSignalHandler(SIGNAL_TYPE.audioStop, this._onStopSignal.bind(this));

        return this;
    }

    setConfig(config: StellaConfig): this {
        this._toneGenerator.setConfig(config);

        return this;
    }

    setVolume(value: number): this {
        this._volume = value;

        return this;
    }

    getVolume(): number {
        return this._volume;
    }

    getBuffer(key: number): AudioOutputBuffer {
        return this._toneGenerator.getBuffer(key);
    }

    private _onVolumeChangeSignal(message: AudioVolumeChangeMessage): void {
        if (message.index === this._index) {
            this._volume = message.value;
            this.volumeChanged.dispatch(this._volume);
        }
    }

    private _onBufferChangeSignal(message: AudioBufferChangeMessage): void {
        if (message.index === this._index) {
            this.bufferChanged.dispatch(message.key);
        }
    }

    private _onStopSignal(index: number): void {
        if (index === this._index) {
            this.stop.dispatch(undefined);
        }
    }

    bufferChanged = new Event<number>();
    volumeChanged = new Event<number>();
    stop = new Event<void>();

    private _toneGenerator = new ToneGenerator();
    private _volume = 0;

}

export default AudioProxy;