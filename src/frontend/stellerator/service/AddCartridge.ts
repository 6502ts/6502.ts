import { injectable } from 'inversify';
import { Ports } from '../../elm/Stellerator/Main.elm';

@injectable()
class AddCartridge {
    constructor() {
        this._input.type = 'file';
    }

    init(ports: Ports): void {
        ports.addCartridge_.subscribe(this._addCartridge);
    }

    private _addCartridge = (): void => {
        this._input.click();
    };

    private _input = document.createElement('input');
}

export default AddCartridge;
