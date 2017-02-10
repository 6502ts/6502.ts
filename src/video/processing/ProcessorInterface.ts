import {EventInterface} from 'microevent.ts';

import RGBASurfaceInterface from '../surface/RGBASurfaceInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';

interface ProcessorInterface {

    init(width: number, height: number): void;

    flush(): void;

    processSurface(surface: PoolMemberInterface<RGBASurfaceInterface>): void;

    emit: EventInterface<PoolMemberInterface<RGBASurfaceInterface>>;

}

export default ProcessorInterface;
