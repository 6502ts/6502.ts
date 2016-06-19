import AudioOutputBuffer from '../../tools/AudioOutputBuffer';
import EventInterface from '../../tools/event/EventInterface';

interface AudioOutputInterface {

    buffer0Changed: EventInterface<AudioOutputBuffer>;

    buffer1Changed: EventInterface<AudioOutputBuffer>;
}

module AudioOutputInterface {

}

export default AudioOutputInterface;
