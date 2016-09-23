export default class Environment implements Changeset {

    constructor(changes?: Changeset, old?: Environment) {
        Object.assign(this, old, changes);
    }

    readonly helppageUrl = '';
}

interface Changeset {
    helppageUrl?: string;
}