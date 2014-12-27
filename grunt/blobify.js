var path = require('path'),
    util = require('util'),
    fs = require('fs');

module.exports = function(grunt) {

    function blobify() {
        var me = this,
            done = me.async(),
            baseDir,
            transactions = 0,
            isDone = false,
            recurse,
            blobs = {},
            visited = {};

        function finish(e) {
            if (isDone) return;

            isDone = true;

            if (!e) {
                writeBlobs(blobs);
            }

            done(e);
        }

        function writeBlobs(blobs) {
            Object.keys(blobs).forEach(function(dest) {
                grunt.file.write(dest, JSON.stringify(blobs[dest]));
                grunt.log.write(util.format('created blob %s\n', dest));
            });
        }

        function startTransaction() {
            transactions++;
        }

        function finishTransaction() {
            if (--transactions === 0) finish();
        }

        function set(blob, _path, value) {
            var atoms = _path.split(path.sep),
                natoms = atoms.length,
                i;

            if (!natoms) return;

            for (i = 0; i < atoms.length - 1; i++) {
                if (atoms[i] === '.') continue;

                if (atoms[i] === '..') {
                    finish(new Error(util.format('invalid path %s', _path)));
                    return;
                }

                blob[atoms[i]] = blob[atoms[i]] || {};
                blob = blob[atoms[i]];
            }

            blob[atoms[natoms - 1]] = value;
        }

        function visit(blob, blobName, _path) {
            var normalizedPath = path.normalize(_path);

            if (visited[normalizedPath]) return;
            visited[normalizedPath] = true;

            startTransaction();

            fs.stat(_path, function(e, stats) {
                if (e) {
                    finish(e);
                    return;
                }

                if (stats.isDirectory()) {
                    if (recurse) visitDirectory(blob, _path);
                } else {
                    visitFile(blob, blobName, _path);
                }

                finishTransaction();
            });
        }

        function visitFile(blob, blobName,_path) {
            startTransaction();

            fs.readFile(_path, {encoding: 'base64'}, function(e, data) {
                if (e) {
                    finish(e);
                    return;
                }

                set(blob, path.normalize(path.relative(baseDir, _path)), data);
                grunt.verbose.write(util.format('Added %s to blob %s\n', _path, blobName));

                finishTransaction();
            });
        }

        function visitDirectory(blob, _path) {
            startTransaction();

            fs.readdir(_path, function(e, entries) {
                if (e) {
                    finish(e);
                    return;
                }

                entries.forEach(function(entry) {
                    visit(blob, path.join(_path, entry));
                });

                finishTransaction();
            });
        }

        var options = me.options({
            baseDir: process.cwd,
            recurse: false
        });

        baseDir = path.resolve(options.baseDir);
        recurse = options.recurse;

        me.files.forEach(function(file) {
            var dest = file.dest,
                blob = blobs[dest] = {};

            file.src.forEach(function(src) {
                visit(blob, dest, path.resolve(src));
            });
        });
    }
    grunt.registerMultiTask('blobify', 'Base64 encode file tree to JSON', blobify);
};
