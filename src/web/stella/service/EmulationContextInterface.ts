import VideoOutputInterface from '../../../machine/io/VideoOutputInterface';
import Board from '../../../machine/stella/Board';

interface EmulationContextInterface {

    getVideo(): VideoOutputInterface;

    getBoard(): Board;

}

export default EmulationContextInterface;
