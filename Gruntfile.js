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
        }
    });

    grunt.registerTask('initial', ['clean', 'tsd', 'ts:build']);
    grunt.registerTask('default', ['ts:build']);
};
