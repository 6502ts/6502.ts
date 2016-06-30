const enum ColorMode {normal, score};

class Playfield {

    constructor(private _collisionMask: number) {
        this.reset();
    }

    reset() {
        this._pattern = 0;
        this._reflected = false;

        this._pf0 = 0;
        this._pf1 = 0;
        this._pf2 = 0;

        this._color = 0;
        this._colorP0 = 0;
        this._colorP1 = 0;
        this._colorMode = ColorMode.normal;
        this._applyColors();

        this._pending = false;
        this._pending0 = false;
        this._pending1 = false;
        this._pending2 = false;
    }

    pf0(value: number) {
        this._pf0 = value;
        this._pending0 = this._pending = true;
    }

    pf1(value: number) {
        this._pf1 = value;
        this._pending1 = this._pending = true;
    }

    pf2(value: number) {
        this._pf2 = value;
        this._pending2 = this._pending = true;
    }

    ctrlpf(value: number): void {
        this._reflected = (value & 1) > 0;
        this._colorMode = (value & 2) > 0 ? ColorMode.score : ColorMode.normal;
        this._applyColors();
    }

    setColor(color: number): void {
        this._color = color;
        this._applyColors();
    }

    setColorP0(color: number): void {
        this._colorP0 = color;
        this._applyColors();
    }

    setColorP1(color: number): void {
        this._colorP1 = color;
        this._applyColors();
    }

    cpuClockTick(): void {
        if (!this._pending) {
            return;
        }

        if (this._pending0) {
            this._applyPf0(this._pf0);
            this._pending = this._pending1 || this._pending2;
        }

        if (this._pending1) {
            this._applyPf1(this._pf1);
            this._pending = this._pending0 || this._pending2;
        }

        if (this._pending2) {
            this._applyPf2(this._pf2);
            this._pending = this._pending0 || this._pending1;
        }
    }

    tick(x: number) {
        if ((x & 0x03) !== 0) {
            return;
        }

        let currentPixel: number;

        if (this._pattern === 0) {
            currentPixel = 0;
        } else if (x < 80) {
            currentPixel = this._pattern & (1 << (x >>> 2));
            this._currentColor = this._colorLeft;
        } else if (this._reflected) {
            currentPixel = this._pattern & (1 << (39 - (x >>> 2)));
            this._currentColor = this._colorRight;
        } else {
            currentPixel = this._pattern & (1 << ((x >>> 2) - 20));
            this._currentColor = this._colorRight;
        }

        this.collision = currentPixel > 0 ? this._collisionMask : 0;
    }

    getPixel(colorIn: number): number {
        return this.collision > 0 ? this._currentColor : colorIn;
    }

    private _applyColors(): void {
        switch (this._colorMode) {
            case ColorMode.normal:
                this._colorLeft = this._colorRight = this._color;
                break;

            case ColorMode.score:
                this._colorLeft = this._colorP0;
                this._colorRight = this._colorP1;
                break;
        }
    }

    private _applyPf0(value: number): void {
        this._pattern = (this._pattern & 0x000FFFF0) | ((value & 0xF0) >>> 4);
    }

    private _applyPf1(value: number): void {
        this._pattern = (this._pattern & 0x000FF00F)
            | ((value & 0x80) >>> 3)
            | ((value & 0x40) >>> 1)
            | ((value & 0x20) <<  1)
            | ((value & 0x10) <<  3)
            | ((value & 0x08) <<  5)
            | ((value & 0x04) <<  7)
            | ((value & 0x02) <<  9)
            | ((value & 0x01) <<  11);
    }

    private _applyPf2(value: number): void {
        this._pattern = (this._pattern & 0x00000FFF) | ((value & 0xFF) << 12);
    }

    collision = 0;

    private _colorLeft = 0;
    private _colorRight = 0;
    private _color = 0;
    private _colorP0 = 0;
    private _colorP1 = 0;
    private _colorMode = ColorMode.normal;

    private _currentColor = 0;
    private _pattern = 0;
    private _reflected = false;

    private _pf0 = 0;
    private _pf1 = 0;
    private _pf2 = 0;

    private _pending = false;
    private _pending0 = false;
    private _pending1 = false;
    private _pending2 = false;
}

export default Playfield;
