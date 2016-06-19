import AudioOutputBuffer from '../../tools/AudioOutputBuffer';
import EventInterface from '../../tools/event/EventInterface';

interface AudioOutputInterface {

    changedBuffer: EventInterface<AudioOutputBuffer>;

}

module AudioOutputInterface {

}

export default AudioOutputInterface;
