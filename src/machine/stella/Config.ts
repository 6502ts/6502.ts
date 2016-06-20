class Config {
    constructor(
        public tvMode: Config.TvMode = Config.TvMode.ntsc,
        public enableAudio = false
    ) {}
}

module Config {

    export const enum TvMode {ntsc, pal, secam};

}

export default Config;
