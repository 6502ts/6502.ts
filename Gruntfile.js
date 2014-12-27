var TS_MAIN = [
    'src/web/testCLI.ts',
    'src/web/ehBasicCLI.ts',

    'bin/ehBasicCLI.ts',
    'bin/testCLI.ts',
    'bin/debugger.ts'
];

var GARBAGE = [
    '.tscache',
    'web/js/compiled',
    'src/**/*.js'
];

var NOTSOGARBAGE = ['web/bower'];

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-bower-install-simple');

    grunt.loadTasks('./grunt');

    grunt.initConfig({
        ts: {
            build: {
                src: TS_MAIN
            },
            options: {
                target: 'es5',
                module: 'commonjs',
                declaration: false,
                sourceMap: false,
                removeComments: false,
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
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            testCLI: {
                files: {
                  'web/js/compiled/testCLI.js': 'src/web/testCLI.js'
                },
                options: {
                    alias: ['./src/web/testCLI:testCLI']
                }
            },
            ehBasicCLI: {
                files: {
                  'web/js/compiled/ehBasicCLI.js': 'src/web/ehBasicCLI.js'
                },
                options: {
                    alias: ['./src/web/ehBasicCLI:ehBasicCLI']
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
        },

        blobify: {
            default: {
                options: {
                    baseDir: './aux'
                },
                src: 'aux/**',
                dest: 'web/js/compiled/files.json'
            }
        }
    });

    grunt.registerTask('bower', ['bower-install-simple']);
    grunt.registerTask('initial', ['clean', 'tsd', 'ts', 'bower', 'browserify']);
    grunt.registerTask('default', ['ts', 'browserify', 'blobify']);
    grunt.registerTask('test', ['ts', 'mochaTest']);
    grunt.registerTask('serve', ['default', 'http-server']);
};
