module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-typings');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bower-install-simple');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.loadTasks('./grunt');

    grunt.initConfig({
        ts: {
            main: {
                tsconfig: true
            }
        },

        clean: {
            base: [
                '.tscache',
                'web/js/compiled',
                'src/**/*.js',
                'bin/**/*.js',
                'tests/ts/**/*.js',
                'tests/fixtures/fs_provider/blob.json'
            ],
            mrproper: [
                'web/bower'
            ]
        },

        tslint: {
            options: {
                configuration: "tslint.json"
            },
            files: [
                "bin/*.ts",
                "src/*/**.ts",
                "tests/ts/**.ts",
            ]
        },

        typings: {
            install: {}
        },

        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            testCLI: {
                dest: 'web/js/compiled/testCLI.js',
                src: [],
                options: {
                    alias: {
                        testCLI: './src/web/testCLI'
                    }
                }
            },
            ehBasicCLI: {
                dest: 'web/js/compiled/ehBasicCLI.js',
                src: [],
                options: {
                    alias: {
                        ehBasicCLI: './src/web/ehBasicCLI'
                    }
                }
            },
            debuggerCLI: {
                dest: 'web/js/compiled/debuggerCLI.js',
                src: [],
                options: {
                    alias: {
                        debuggerCLI: './src/web/debuggerCLI'
                    }
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'nyan',
                    ui: 'tdd',
                    bail: false
                },
                src: ['tests/js/*.js', 'tests/ts/*.js']
            },
            debug: {
                options: {
                    reporter: 'spec',
                    ui: 'tdd',
                    bail: true
                },
                src: ['tests/js/*.js', 'tests/ts/*.js']
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
            },
            tests: {
                options: {
                    baseDir: './tests/fixtures/fs_provider',
                    recurse: true
                },
                src: './tests/fixtures/fs_provider/tree',
                dest: './tests/fixtures/fs_provider/blob.json'
            }
        },

        watch: {
            build: {
                files: ['src/**/*.ts', 'aux/**'],
                tasks: ['build']
            }
        },

        notify_hooks: {
            options: {
                enabled: true,
                success: true
            }
        }
    });

    grunt.registerTask('bower', ['bower-install-simple']);
    grunt.registerTask('build', ['tslint', 'ts', 'browserify', 'blobify:default']);
    grunt.registerTask('test', ['ts', 'tslint', 'blobify:tests', 'mochaTest:test']);
    grunt.registerTask('test:debug', ['ts', 'tslint', 'blobify:tests', 'mochaTest:debug']);

    grunt.registerTask('cleanup', ['clean:base']);
    grunt.registerTask('mrproper', ['clean']);

    grunt.registerTask('initial', ['clean', 'typings', 'bower', 'build', 'test']);
    grunt.registerTask('serve', ['http-server']);

    grunt.registerTask('default', ['build']);

    grunt.task.run('notify_hooks');
};
