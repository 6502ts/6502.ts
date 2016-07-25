import * as screenfull from 'screenfull';

export default class FullscreenVideoDriver {

    constructor(private _element: HTMLElement) {}

    engage(): void {
        screenfull.request(this._element);
        this._adjustSize();
    }

    disengage(): void {
        screenfull.exit();
        this._adjustSize();
    }

    toggle(): void {
        screenfull.toggle(this._element);
        this._adjustSize();
    }

    isEngaged(): boolean {
        return screenfull.isFullscreen;
    }

    private _adjustSize() {
        if (!this.isEngaged()) {
            return;
        }

        window.addEventListener('resize', this._resizeListener);
    }

    private _adjustSizeForFullscreen() {
        if (!this.isEngaged()) {
            window.removeEventListener('resize', this._resizeListener);

            this._element.style.width = '';
            this._element.style.height = '';
            return;
        }

        const actualWidth = window.innerWidth,
            actualHeight = window.innerHeight;

        let correctedWidth: number, correctedHeight: number;

        if (actualWidth > actualHeight) {
            correctedHeight = actualHeight;
            correctedWidth = actualHeight / 3 * 4;
        } else {
            correctedWidth = actualWidth;
            correctedHeight = actualHeight / 4 * 3;
        }

        this._element.style.width = correctedWidth + 'px';
        this._element.style.height = correctedHeight + 'px';
    }

    private _resizeListener: () => void = this._adjustSizeForFullscreen.bind(this);

}
