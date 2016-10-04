import {EventInterface} from 'microevent.ts';

import AudioOutputBuffer from '../../tools/AudioOutputBuffer';

interface AudioOutputInterface {

    bufferChanged: EventInterface<number>;

    volumeChanged: EventInterface<number>;

    stop: EventInterface<void>;

    getBuffer(key: number): AudioOutputBuffer;

    getVolume(): number;

}

export default AudioOutputInterface;
