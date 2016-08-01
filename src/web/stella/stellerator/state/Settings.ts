export default class Settings implements Changeset {

    constructor(changes?: Changeset, old?: Settings) {
        Object.assign(this, old, changes);
    }

    smoothScaling = true;

}

interface Changeset {
    smoothScaling?: boolean;
}
