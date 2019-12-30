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

import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';
import * as pathlib from 'path';

class Completer {
    constructor(private _availableCommands: Array<string>, private _fsProvider: FilesystemProviderInterface) {}

    complete(cmd: string): Completer.CompletionResult {
        const chunks = cmd.split(/\s+/);

        if (chunks.length > 0 && chunks[0] === '') {
            chunks.shift();
        }

        switch (chunks.length) {
            case 0:
                return new Completer.CompletionResult(this._availableCommands, cmd);

            case 1:
                return new Completer.CompletionResult(
                    this._availableCommands.filter((candidate: string) => candidate.search(chunks[0]) === 0),
                    chunks[0]
                );

            default:
                const path = chunks[chunks.length - 1];

                return new Completer.CompletionResult(this._completePath(path), path);
        }
    }

    private _completePath(path: string): Array<string> {
        let dirname = pathlib.dirname(path),
            basename = pathlib.basename(path),
            directory: Array<string>;

        if (!this._fsProvider) {
            return [];
        }

        if ((path && path[path.length - 1] === pathlib.sep) || path[path.length - 1] === '/') {
            dirname = path;
            basename = '';
        }

        try {
            directory = this._fsProvider.readDirSync(dirname);

            return this._appendSlashesToDirectories(
                directory
                    .filter((candidate: string) => candidate.search(basename) === 0)
                    .map(entry => pathlib.join(dirname, entry))
            );
        } catch (e) {}

        return [];
    }

    private _appendSlashesToDirectories(paths: Array<string>) {
        return paths.map((path: string): string => {
            try {
                return this._fsProvider.getTypeSync(path) === FilesystemProviderInterface.FileType.DIRECTORY
                    ? pathlib.join(path, pathlib.sep)
                    : path;
            } catch (e) {
                return path;
            }
        });
    }
}

namespace Completer {
    export class CompletionResult {
        constructor(public candidates: Array<string>, public match: string) {}
    }
}

export { Completer as default };
