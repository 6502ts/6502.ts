import AudioOutputBuffer from '../../tools/AudioOutputBuffer';
import EventInterface from '../../tools/event/EventInterface';

interface AudioOutputInterface {

    bufferChanged: EventInterface<number>;

    stop: EventInterface<void>;

    getBuffer(key: number): AudioOutputBuffer;

}

export default AudioOutputInterface;
