import SwitchInterface from './SwitchInterface';

interface PaddleInterface {

    setValue(value: number): void;

    getValue(): number;

    getFire(): SwitchInterface;

}

export default PaddleInterface;
