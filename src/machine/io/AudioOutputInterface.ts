import AudioOutputBuffer from '../../tools/AudioOutputBuffer';
import EventInterface from '../../tools/event/EventInterface';

interface AudioOutputInterface {

    bufferChanged: EventInterface<number>;

    volumeChanged: EventInterface<number>;

    stop: EventInterface<void>;

    getBuffer(key: number): AudioOutputBuffer;

    getVolume(): number;

}

export default AudioOutputInterface;
