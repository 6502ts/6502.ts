import Switch from './Switch';
import PaddleInterface from './PaddleInterface';
import Event from '../../tools/event/Event';

export default class Paddle implements PaddleInterface {

    setValue(value: number): void {
        this._value = value;
        this.valueChanged.dispatch(value);
    }

    getValue(): number {
        return this._value;
    }

    getFire(): Switch {
        return this._fireSwitch;
    }

    valueChanged = new Event<number>();

    protected _fireSwitch = new Switch();
    protected _value = 0.5;

}
