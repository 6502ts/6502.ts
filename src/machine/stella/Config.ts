'use strict';

class Config {
    constructor(
        public tvMode: Config.TvMode = Config.TvMode.ntsc
    ) {}
}

module Config {

    export enum TvMode {ntsc, pal, secam};

}

export = Config;
