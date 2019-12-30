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

import assert from 'assert';
import * as path from 'path';
import * as util from 'util';

import NodeFilesystemProvider from '../../../src/fs/NodeFilesystemProvider';
import FilesystemProviderInterface from '../../../src/fs/FilesystemProviderInterface';

const fixtures = {
    foo: 'Балканская черепаха',
    baz: 'foobar',
    treeDir: ['bar', 'foo']
};

interface BufferInterface {
    length: number;
    [index: number]: number;
}

function assertBufferIdentity(b1: BufferInterface, b2: BufferInterface): void {
    assert.strictEqual(b1.length, b2.length, util.format('buffers differ in length, %s vs. %s', b1.length, b2.length));

    for (let i = 0; i < b1.length; i++) {
        assert.strictEqual(b1[i], b2[i], util.format('buffers differ at byte %s, %s vs. %s', i, b1[i], b2[i]));
    }
}

function runProviderTests(factory: () => FilesystemProviderInterface): void {
    let provider: FilesystemProviderInterface;

    setup(function() {
        provider = factory();
    });

    function testFileIdentity(filePath: string, key: string) {
        test(util.format('%s as UTF-8, sync', filePath), function() {
            assert.strictEqual(provider.readTextFileSync(filePath), (fixtures as any)[key]);
        });

        test(util.format('%s as binary, sync', filePath), function() {
            assertBufferIdentity(provider.readBinaryFileSync(filePath), Buffer.from((fixtures as any)[key]));
        });
    }

    function testDirectoryListing(filePath: string, content: Array<string>) {
        test(util.format('directory listing %s, sync', filePath), function() {
            assert.deepEqual(provider.readDirSync(filePath).sort(), content.sort());
        });
    }

    testFileIdentity('tree/foo', 'foo');
    testFileIdentity('tree/./bar/.././foo', 'foo');
    testFileIdentity('tree/bar/baz', 'baz');

    test('listing nonexisting directories should throw', function() {
        assert.throws(function() {
            provider.readDirSync('tree/baz');
        });
    });

    test('listing files should throw', function() {
        assert.throws(function() {
            provider.readDirSync('tree/foo');
        });
    });

    test('reading nonexisting files should throw', function() {
        assert.throws(function() {
            provider.readTextFileSync('bar');
        });

        assert.throws(function() {
            provider.readBinaryFileSync('bar');
        });
    });

    test('reading directories should throw', function() {
        assert.throws(function() {
            provider.readTextFileSync('tree');
        });

        assert.throws(function() {
            provider.readBinaryFileSync('tree');
        });
    });

    testDirectoryListing('tree', fixtures.treeDir);
    testDirectoryListing('tree/', fixtures.treeDir);
    testDirectoryListing('tree/bar/./../', fixtures.treeDir);

    test('tree is a directory, sync', function() {
        assert.strictEqual(provider.getTypeSync('tree'), FilesystemProviderInterface.FileType.DIRECTORY);
    });

    test('tree/foo is a file, sync', function() {
        assert.strictEqual(provider.getTypeSync('tree/foo'), FilesystemProviderInterface.FileType.FILE);
    });

    test('stating a nonexisting file should throw', function() {
        assert.throws(function() {
            provider.getTypeSync('bar');
        });
    });

    test('pushd / popd', function() {
        assert.strictEqual(provider.readTextFileSync('tree/bar/baz'), fixtures.baz);
        provider.pushd('tree');
        assert.strictEqual(provider.readTextFileSync('bar/baz'), fixtures.baz);
        provider.pushd();
        provider.chdir('bar');
        assert.strictEqual(provider.readTextFileSync('baz'), fixtures.baz);
        provider.popd();
        assert.strictEqual(provider.readTextFileSync('bar/baz'), fixtures.baz);
        provider.popd();
        assert.strictEqual(provider.readTextFileSync('tree/bar/baz'), fixtures.baz);
    });

    test('cwd listing', function() {
        provider.chdir('tree');
        assert.deepEqual(provider.readDirSync('').sort(), fixtures.treeDir.sort());
    });

    test('root dir listing', function() {
        const listing = provider.readDirSync('');

        assert(listing.indexOf('tree') >= 0);
    });
}

suite('FS Providers', function() {
    suite('NodeFileSystemProvider', function() {
        function factory(): FilesystemProviderInterface {
            const provider = new NodeFilesystemProvider();

            provider.chdir(path.join(__dirname, '../../fixtures/fs_provider'));

            return provider;
        }

        runProviderTests(factory);
    });
});
