import AudioOutputBuffer from '../../tools/AudioOutputBuffer';
import EventInterface from '../../tools/event/EventInterface';

interface AudioOutputInterface {

    bufferChanged: EventInterface<AudioOutputBuffer>;

    stop: EventInterface<void>;

}

export default AudioOutputInterface;
