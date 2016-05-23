class Metrics {
    constructor(
        public visibleWidth: number,
        public totalWidth: number,
        public visibleLines: number,
        public vblank: number
    ) {
        this.hblank = totalWidth - visibleWidth;
        this.overscanStart = vblank + visibleLines;
    }

    public overscanStart: number;
    public hblank: number;
    public maxX: number;
}

export default Metrics;
