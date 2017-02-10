import {EventInterface} from 'microevent.ts';

import RGBASurfaceInterface from '../surface/RGBASurfaceInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import ProcessorInterface from './ProcessorInterface';
import ProcessorFactory from './ProcessorFactory';
import {ProcessorConfig, Type} from './ProcessorConfig';

class ProcessorPipeline implements ProcessorInterface {

    constructor(config?: Array<ProcessorConfig>) {
        if (!config || config.length === 0) {
            config = [{type: Type.passthrough}];
        }

        const factory = new ProcessorFactory();

        this._processors = config.map(cfg => factory.create(cfg));

        for (let i = 1; i < this._processors.length; i++) {
            this._processors[i - 1].emit.addHandler(surface => this._processors[i].processSurface(surface));
        }

        this.emit = this._processors[this._processors.length - 1].emit;
    }

    init(width: number, height: number): void {
        this._processors.forEach(prc => prc.init(width, height));
    }

    flush(): void {
        this._processors.forEach(prc => prc.flush());
    }

    processSurface(surface: PoolMemberInterface<RGBASurfaceInterface>): void {
        this._processors[0].processSurface(surface);
    }

    emit: EventInterface<PoolMemberInterface<RGBASurfaceInterface>>;

    private _processors: Array<ProcessorInterface>;

}

export default ProcessorPipeline;