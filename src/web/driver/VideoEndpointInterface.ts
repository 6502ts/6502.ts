import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import EventInterface from '../../tools/event/EventInterface';

interface VideoEndpointInterface {

    getWidth(): number;

    getHeight(): number;

    newFrame: EventInterface<PoolMemberInterface<ImageData>>;

}

export default VideoEndpointInterface;
