import { Ports } from '../../elm/Stellerator/Main.elm';
import { injectable } from 'inversify';

@injectable()
class ScrollIntoView {
    init(ports: Ports): void {
        ports.scrollIntoView_.subscribe(this._scrollIntoView);
    }

    private _scrollIntoView = ([position, id]: [ScrollLogicalPosition, string]) => {
        const node = document.getElementById(id);

        if (node) {
            node.scrollIntoView({ block: position });
        } else {
            new Task(position, id).start();
        }
    };
}

class Task {
    constructor(private _position: ScrollLogicalPosition, private _id: string, private _timeout = 100) {}

    start(): void {
        setTimeout(() => this._observer.disconnect(), this._timeout);

        this._observer.observe(document.body, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true
        });
    }

    private _onMutation = (mutations: Array<MutationRecord>): void => {
        if (!mutations.some(m => m.addedNodes)) {
            return;
        }

        const node = document.getElementById(this._id);

        if (node) {
            this._observer.disconnect();
            clearTimeout(this._timeoutHandle);

            node.scrollIntoView({ block: this._position });
        }
    };

    private _observer = new MutationObserver(this._onMutation);
    private _timeoutHandle: any = null;
}

export default ScrollIntoView;
