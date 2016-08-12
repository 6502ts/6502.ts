import RpcProviderInterface from '../../../../tools/worker/RpcProviderInterface';
import AudioOutputInterface from '../../../../machine/io/AudioOutputInterface';

import {
    SIGNAL_TYPE,
    AudioBufferChangeMessage,
    AudioVolumeChangeMessage
} from './messages';

class AudioDriver {

    constructor (
        private _index: number,
        private _rpc: RpcProviderInterface
    ) {
        this._handlerContext = {
            index: this._index,
            self: this
        };
    }

    bind(audio: AudioOutputInterface): void {
        if (this._audio) {
            return;
        }

        this._audio = audio;

        this._audio.bufferChanged.addHandler(AudioDriver._onBufferChanged, this._handlerContext);
        this._audio.volumeChanged.addHandler(AudioDriver._onVolumeChanged, this._handlerContext);
        this._audio.stop.addHandler(AudioDriver._onStop, this._handlerContext);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._audio.bufferChanged.removeHandler(AudioDriver._onBufferChanged, this._handlerContext);
        this._audio.volumeChanged.removeHandler(AudioDriver._onVolumeChanged, this._handlerContext);
        this._audio.stop.removeHandler(AudioDriver._onStop, this._handlerContext);

        this._audio = null;
    }

    private static _onBufferChanged(key: number, context: HandlerContext) {
        context.self._rpc.signal<AudioBufferChangeMessage>(SIGNAL_TYPE.audioBufferChange, {
            index: context.index,
            key
        });
    }

    private static _onVolumeChanged(value: number, context: HandlerContext) {
        context.self._rpc.signal<AudioVolumeChangeMessage>(SIGNAL_TYPE.audioVolumeChange, {
            index: context.index,
            value
        });
    }

    private static _onStop(value: void, context: HandlerContext) {
        context.self._rpc.signal<number>(SIGNAL_TYPE.audioStop, context.self._index);
    }

    private _audio: AudioOutputInterface = null;
    private _handlerContext: HandlerContext = null;

}

interface HandlerContext {
    self: AudioDriver;
    index: number;
}

export default AudioDriver;