class Metrics {
    constructor(visibleLines: number, vblank: number) {
        this.visibleLines = visibleLines + 20;
        this.vblank = vblank - 5;
        this.overscanStart = vblank + visibleLines + 15;
    }

    public overscanStart = 0;
    public visibleLines = 0;
    public vblank = 0;

}

export default Metrics;
