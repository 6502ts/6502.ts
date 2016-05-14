class Config {
    constructor(
        public tvMode: Config.TvMode = Config.TvMode.ntsc
    ) {}
}

module Config {

    export const enum TvMode {ntsc, pal, secam};

}

export = Config;
