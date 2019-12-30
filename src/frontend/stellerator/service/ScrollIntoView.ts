/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

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
    constructor(private _position: ScrollLogicalPosition, private _id: string, private _timeout = 500) {}

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
