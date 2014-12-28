var _ = require('lodash'),
    assert = require('assert'),
    path = require('path'),
    util = require('util');

var NodeFilesystemProvider = require('../src/fs/NodeFilesystemProvider'),
    PrepackagedFilesystemProvider = require('../src/fs/PrepackagedFilesystemProvider');

var artifacts = {
        foo: 'Балканская черепаха',
        baz: 'foobar'
    };

var blob;

function assertBufferIdentity(b1, b2) {
    assert.strictEqual(b1.length, b2.length, util.format('buffers differ in length, %s vs. %s',
        b1.length, b2.length));

    for (var i = 0; i < b1.length; i++) {
        assert.strictEqual(b1[i], b2[i], util.format('buffers differ at byte %s, %s vs. %s',
            i, b1[i], b2[i]));
    }
}

function runProviderTests(factory) {
    var provider;

    setup(function() {
        provider = factory();
    });

    function testFileIdentity(path, key) {
        test(util.format('%s as UTF-8, sync', path), function() {
            assert.strictEqual(provider.readTextFileSync(path), artifacts[key]);
        });

        test(util.format('%s as binary, sync', path), function() {
            assertBufferIdentity(provider.readBinaryFileSync(path), new Buffer(artifacts[key]));
        });
    }

    testFileIdentity('tree/foo', 'foo');
    testFileIdentity('tree/bar/baz', 'baz');

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


    test('pushd / popd', function() {
        assert.strictEqual(provider.readTextFileSync('tree/bar/baz'), artifacts.baz);
        provider.pushd('tree');
        assert.strictEqual(provider.readTextFileSync('bar/baz'), artifacts.baz);
        provider.pushd();
        provider.chdir('bar');
        assert.strictEqual(provider.readTextFileSync('baz'), artifacts.baz);
        provider.popd(); 
        assert.strictEqual(provider.readTextFileSync('bar/baz'), artifacts.baz);
        provider.popd();
        assert.strictEqual(provider.readTextFileSync('tree/bar/baz'), artifacts.baz);
    });
}

suite('FS Providers', function()  {

    suite('NodeFileSystemProvider', function() {

        function factory() {
            var provider = new NodeFilesystemProvider();

            provider.chdir(path.join(__dirname, 'fs_provider'));

            return provider;
        }

        runProviderTests(factory);

    });

    suite('PrepackagedFileSystemProvider', function() {

        function factory() {
            return new PrepackagedFilesystemProvider(_.cloneDeep(blob));
        }

        test('Loading the prepackaged blob', function() {
            blob = require('./fs_provider/blob.json');
        });

        runProviderTests(factory);

    });

});
