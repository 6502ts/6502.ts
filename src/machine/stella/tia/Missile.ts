import Metrics from './Metrics';

class Missile {

    constructor(private _metrics: Metrics) {}

    public enam(value: number) {
        this.enabled = (value & 2) > 0;
    }

    public hmm(value: number) {
        const masked = (value & 0xF0) >> 4;
        this.motion = (masked & 0x8) ? 0xF - masked + 1 : -masked | 0;
    }

    public hmove() {
        this.pos += this.motion;

        if (this.pos >= this._metrics.visibleWidth) {
            this.pos -= this._metrics.visibleWidth;
        }

        if (this.pos < 0) {
            this.pos += this._metrics.visibleWidth;
        }
    }

    public renderPixel(x: number, y: number, colorIn: number): number {
        return (this.enabled && x >= this.pos && (x - this.pos) < this.width) ? this.color : colorIn;
    }

    public color = 0xFFFFFFFF;
    public pos = 0;
    public width = 1;
    public enabled = false;
    public motion = 0;

}

export default Missile;
