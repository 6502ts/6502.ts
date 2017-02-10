import ProcessorInterface from './ProcessorInterface';
import * as Config from './ProcessorConfig';

import PassthroughProcessor from './PassthroughProcessor';
import FrameMergeProcessor from './FrameMergeProcessor';

class ProcessorFactory {

    create(config: Config.ProcessorConfig): ProcessorInterface {
        switch (config.type) {
            case Config.Type.passthrough:
                return new PassthroughProcessor();

            case Config.Type.merge:
                return new FrameMergeProcessor();

            default:
                throw new Error('cannot happen: invalid processor type');
        }
    }

}

export default ProcessorFactory;