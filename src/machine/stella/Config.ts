class Config {
    constructor(
        public tvMode: Config.TvMode = Config.TvMode.ntsc,
        public enableAudio = true
    ) {}

    public static getClockMhz(config: Config): number {
        switch (config.tvMode) {
            case Config.TvMode.ntsc:
                return 3.579545;

            case Config.TvMode.pal:
            case Config.TvMode.secam:
                return 3.546894;
        }
    }
}

module Config {

    export const enum TvMode {ntsc, pal, secam};

}

export default Config;
