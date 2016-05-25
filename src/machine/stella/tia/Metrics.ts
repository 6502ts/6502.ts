class Metrics {
    constructor(
        public visibleLines: number,
        public vblank: number
    ) {
        this.overscanStart = vblank + visibleLines;
    }

    public overscanStart: number;
}

export default Metrics;
