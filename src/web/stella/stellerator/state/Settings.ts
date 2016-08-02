export default class Settings implements Changeset {

    constructor(changes?: Changeset, old?: Settings) {
        Object.assign(this, old, changes);

        if (this.gamma < 0.1) {
            this.gamma = 0.1;
        }

        if (this.gamma > 5) {
            this.gamma = 5;
        }
    }

    smoothScaling = true;
    webGlRendering = true;
    gamma = 1;
}

interface Changeset {
    smoothScaling?: boolean;
    webGlRendering?: boolean;
    gamma?: number;
}
