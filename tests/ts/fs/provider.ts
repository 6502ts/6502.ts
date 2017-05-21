/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as _ from 'lodash';
import * as assert from 'assert';
import * as path from 'path';
import * as util from 'util';

import NodeFilesystemProvider from '../../../src/fs/NodeFilesystemProvider';
import PrepackagedFilesystemProvider from '../../../src/fs/PrepackagedFilesystemProvider';
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
    assert.strictEqual(b1.length, b2.length, util.format('buffers differ in length, %s vs. %s',
        b1.length, b2.length));

    for (let i = 0; i < b1.length; i++) {
        assert.strictEqual(b1[i], b2[i], util.format('buffers differ at byte %s, %s vs. %s',
            i, b1[i], b2[i]));
    }
}

function runProviderTests(factory: () => FilesystemProviderInterface): void {
    let provider: FilesystemProviderInterface;

    setup(function() {
        provider = factory();
    });

    function testFileIdentity(path: string, key: string) {
        test(util.format('%s as UTF-8, sync', path), function() {
            assert.strictEqual(provider.readTextFileSync(path), (fixtures as any)[key]);
        });

        test(util.format('%s as binary, sync', path), function() {
            assertBufferIdentity(provider.readBinaryFileSync(path), new Buffer((fixtures as any)[key]));
        });
    }

    function testDirectoryListing(path: string, content: Array<string>) {
        test(util.format('directory listing %s, sync', path), function() {
            assert.deepEqual(provider.readDirSync(path).sort(), content.sort());
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

suite('FS Providers', function()  {

    suite('NodeFileSystemProvider', function() {

        function factory(): FilesystemProviderInterface {
            const provider = new NodeFilesystemProvider();

            provider.chdir(path.join(__dirname, '../../fixtures/fs_provider'));

            return provider;
        }

        runProviderTests(factory);

    });

    suite('PrepackagedFileSystemProvider', function() {

        let blob: PrepackagedFilesystemProvider.BlobInterface;

        function factory() {
            return new PrepackagedFilesystemProvider(_.cloneDeep(blob));
        }

        test('Loading the prepackaged blob', function() {
            blob = require('../../fixtures/fs_provider/blob.json');
        });

        runProviderTests(factory);

    });

});
