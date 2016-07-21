import VideoOutputInterface from '../../../machine/io/VideoOutputInterface';

interface EmulationContextInterface {

    getVideo(): VideoOutputInterface;

}

export default EmulationContextInterface;
