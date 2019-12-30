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

import { injectable } from 'inversify';
import { Ports } from '../../elm/Stellerator/Main.elm';

@injectable()
class MediaApi {
    init(ports: Ports): void {
        this._ports = ports;

        ports.watchMedia_.subscribe(this._watchMedia);
    }

    private _watchMedia = (queryList: Array<string>): void => {
        this._queries.forEach(q => {
            if (q.removeEventListener) {
                q.removeEventListener('change', this._updateQueries);
            } else {
                q.removeListener(this._updateQueries);
            }
        });

        this._queries = queryList.map(q => matchMedia(q));
        this._queries.forEach(q => {
            if (q.removeEventListener) {
                q.addEventListener('change', this._updateQueries);
            } else {
                q.addListener(this._updateQueries);
            }
        });

        this._updateQueries();
    };

    private _updateQueries = (): void => this._ports.onMediaUpdate_.send(this._queries.map(q => q.matches));

    private _ports: Ports;
    private _queries: Array<MediaQueryList> = [];
}

export default MediaApi;
