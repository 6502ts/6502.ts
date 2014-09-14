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
    'ehBasicCLI.ts',
    'testCLI.ts',
    'debugger.ts',
    'ehBasicMonitor.ts'
];

var JS_BUILD = TS_SOURCE.map(function(tsFile) {
    return tsFile.replace(/\.ts$/, '.js');
});

var GARBAGE = [
    '.tscache'
];
Array.prototype.push.apply(GARBAGE, JS_BUILD);

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-http-server');

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

        clean: GARBAGE,

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
            browser: {
                files: {
                  'web/js/6502.js': JS_BUILD
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
        }
    });

    grunt.registerTask('initial', ['clean', 'tsd', 'ts']);
    grunt.registerTask('default', ['ts', 'browserify']);
    grunt.registerTask('test', ['ts', 'mochaTest']);
    grunt.registerTask('serve', ['default', 'http-server']);
};
