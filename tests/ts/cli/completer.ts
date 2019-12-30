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

import * as pathlib from 'path';
import assert from 'assert';
import * as util from 'util';
import Completer from '../../../src/cli/Completer';
import NodeFilesystemProvider from '../../../src/fs/NodeFilesystemProvider';

suite('CLI Completer', function() {
    let completer: Completer;

    function testCompletion(cmd: string, candidates: Array<string>, match: string): void {
        test(util.format('"%s" completes to [%s], match: "%s"', cmd, candidates.join(', '), match), function() {
            const result = completer.complete(cmd);

            assert.deepEqual(result.candidates.sort(), candidates.sort());
            assert.strictEqual(result.match, match);
        });
    }

    setup(function() {
        const fsProvider = new NodeFilesystemProvider();
        fsProvider.chdir(pathlib.join(__dirname, '../../fixtures/completer'));

        completer = new Completer(['soup', 'soop', 'something', 'else'], fsProvider);
    });

    suite('command completion for [soup, soop, something, else]', function() {
        testCompletion('', ['soup', 'soop', 'something', 'else'], '');
        testCompletion('so', ['soup', 'soop', 'something'], 'so');
        testCompletion('el', ['else'], 'el');
        testCompletion('  else', ['else'], 'else');
        testCompletion('frotz', [], 'frotz');
    });

    suite('path completion in tests/fixtures/completer', function() {
        testCompletion('frotz ', ['foo', 'foopb', 'foopa', 'baraz', 'bar/'], '');
        testCompletion(' else foo', ['foo', 'foopb', 'foopa'], 'foo');
        testCompletion('a foopa', ['foopa'], 'foopa');
        testCompletion('a ba', ['bar/', 'baraz'], 'ba');
        testCompletion('a bar', ['bar/', 'baraz'], 'bar');
        testCompletion('a bar/', ['bar/baz'], 'bar/');
        testCompletion('a bar/baz', ['bar/baz'], 'bar/baz');
        testCompletion('a a', [], 'a');
        testCompletion('a foo bar', ['bar/', 'baraz'], 'bar');
    });
});
