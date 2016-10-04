import {EventInterface} from 'microevent.ts';

import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';

interface VideoEndpointInterface {

    getWidth(): number;

    getHeight(): number;

    newFrame: EventInterface<PoolMemberInterface<ImageData>>;

}

export default VideoEndpointInterface;
