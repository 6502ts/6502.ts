var TS_SOURCE = [
    'src/Cpu.ts',
    'src/Debugger.ts',
    'src/DebuggerFrontend.ts',
    'src/Disassembler.ts',
    'src/EhBasicMonitor.ts',
    'src/Instruction.ts',
    'src/SimpleMemory.ts',
    'src/binary.ts',
    'src/hex.ts',
    'src/CommandInterpreter.ts',
    'src/NodeFilesystemProvider.ts',
    'src/TestCLI.ts',
    'src/NodeCLIRunner.ts',
    'src/EhBasicCLI.ts',
    'src/web/testCLI.ts',
    'ehBasicCLI.ts',
    'testCLI.ts',
    'debugger.ts'
];

var JS_BUILD = TS_SOURCE.map(function(tsFile) {
    return tsFile.replace(/\.ts$/, '.js');
});

var GARBAGE = [
    '.tscache',
    'web/js/compiled'
];
Array.prototype.push.apply(GARBAGE, JS_BUILD);

var NOTSOGARBAGE = ['web/bower'];

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-bower-install-simple');

    grunt.initConfig({
        ts: {
            build: {
                src: TS_SOURCE
            },
            options: {
                target: 'es5',
                module: 'commonjs',
                declaration: false,
                sourceMap: false,
                removeComments: false,
                fast: 'always',
                noImplicitAny: true
            },
        },

        clean: {
            clean: GARBAGE,
            mrproper: GARBAGE.concat(NOTSOGARBAGE)
        },

        tsd: {
            refresh: {
                options: {
                    command: 'reinstall',
                    latest: true,
                    config: 'tsd.json'
                }
            }
        },

        browserify: {
            testCLI: {
                files: {
                  'web/js/compiled/testCLI.js': 'src/web/testCLI.js'
                },
                options: {
                    alias: ['./src/web/testCLI:testCLI']
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    ui: 'tdd'
                },
                src: ['tests/**.js']
            }
        },

        'http-server': {
            dev: {
                root: 'web',
                port: 6502,
                host: '127.0.0.1',
                autoIndex: true,
                ext: 'html',
                cache: -1
            }
        },

        "bower-install-simple": {
            install: {
                options: {
                    directory: 'web/bower'
                }
            }
        }
    });

    grunt.registerTask('bower', ['bower-install-simple']);
    grunt.registerTask('initial', ['clean', 'tsd', 'ts', 'bower', 'browserify']);
    grunt.registerTask('default', ['ts', 'browserify']);
    grunt.registerTask('test', ['ts', 'mochaTest']);
    grunt.registerTask('serve', ['default', 'http-server']);
};
