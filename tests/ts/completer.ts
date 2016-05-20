///<reference path="./interface/mocha.d.ts"/>

import * as pathlib from 'path';
import * as assert from 'assert';
import * as util from 'util';
import Completer from '../../src/cli/Completer';
import NodeFilesystemProvider from '../../src/fs/NodeFilesystemProvider';

suite('CLI Completer', function() {

    let completer: Completer;

    function testCompletion(cmd: string, candidates:  Array<string>, match: string): void {
        test(
            util.format('"%s" completes to [%s], match: "%s"', cmd, candidates.join(', '), match),
            function() {
                let result = completer.complete(cmd);

                assert.deepEqual(result.candidates.sort(), candidates.sort());
                assert.strictEqual(result.match, match);
            }
        );
    }

    setup(function() {
        const fsProvider = new NodeFilesystemProvider();
        fsProvider.chdir(pathlib.join(__dirname, '../fixtures/completer'));

        completer = new Completer(
            ['soup', 'soop', 'something', 'else'],
            fsProvider
        );
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
