import PaddleInterface from '../../machine/io/PaddleInterface';

export default class MouseAsPaddleDriver {

    bind(paddle: PaddleInterface): void {
        if (this._paddle) {
            return;
        }

        this._paddle = paddle;
        this._x = -1;

        document.addEventListener('mousemove', this._listener);
    }

    unbind(): void {
        if (!this._paddle) {
            return;
        }

        document.removeEventListener('mousemove', this._listener);
        this._paddle = null;
    }

    private _onDocumentMouseMove(e: MouseEvent) {
        if (this._x >= 0) {
            const dx = e.screenX - this._x;
            let value = this._paddle.getValue();

            value += -dx / window.innerWidth / 0.9;
            if (value < 0) value = 0;
            if (value > 1) value = 1;

            this._paddle.setValue(value);
        }

        this._x = e.screenX;
    }

    private _paddle: PaddleInterface;
    private _x = -1;
    private _listener: (e: MouseEvent) => void = this._onDocumentMouseMove.bind(this);

}
