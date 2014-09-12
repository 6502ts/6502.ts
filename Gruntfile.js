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
    'debugger.ts',
    'ehBasicMonitor.ts'
];

var GARBAGE = [
    '.tscache'
];
TS_SOURCE.forEach(function(tsFile) {
    GARBAGE.push(
        tsFile.replace(/\.ts$/, '.js')
    );
});

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-contrib-clean');

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
        }
    });

    grunt.registerTask('initial', ['clean', 'tsd', 'ts:build']);
    grunt.registerTask('default', ['ts:build']);
};
