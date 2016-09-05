const path = require('path'),
    envify = require('envify/custom');

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
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-exorcise');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadTasks('./grunt');

    grunt.initConfig({
        ts: {
            main: {
                tsconfig: {
                    tsconfig: '.',
                    passThrough: true
                }
            },
            worker: {
                tsconfig: {
                    tsconfig: './worker',
                    passThrough: true,
                    updateFiles: true
                }
            }
        },

        clean: {
            base: [
                '.tscache',
                'web/js/compiled',
                'src/**/*.js',
                'bin/**/*.js',
                'tests/ts/**/*.js',
                'tests/fixtures/fs_provider/blob.json',
                'web/stellerator.html',
                'build'
            ],
            mrproper: [
                'web/bower',
                'typings'
            ],
            worker: [
                'worker/src/**/**.js'
            ]
        },

        tslint: {
            options: {
                configuration: "tslint.json"
            },
            files: [
                "bin/*.ts",
                "src/**/*.ts",
                "worker/**/src/*.ts",
                "tests/ts/**/*.ts",
            ]
        },

        typings: {
            install: {}
        },

        browserify: {
            options: {
                configure: b => b
                    .plugin('tsify', {project: __dirname})
                    .transform('brfs'),
                browserifyOptions: {
                    debug: true
                }
            },
            ehBasicCLI: {
                dest: 'web/js/compiled/ehBasicCLI.js',
                src: [],
                options: {
                    alias: {
                        ehBasicCLI: './src/web/ehBasicCLI.ts'
                    }
                }
            },
            debuggerCLI: {
                dest: 'web/js/compiled/debuggerCLI.js',
                src: [],
                options: {
                    alias: {
                        debuggerCLI: './src/web/debuggerCLI.ts'
                    }
                }
            },
            stellaCLI: {
                dest: 'web/js/compiled/stellaCLI.js',
                src: [],
                options: {
                    alias: {
                        stellaCLI: './src/web/stellaCLI.ts'
                    }
                }
            },
            stella_worker: {
                options: {
                    configure: b => b
                        .plugin('tsify', {project: path.join(__dirname, 'worker')})
                        .transform('brfs'),
                },
                dest: 'web/js/compiled/stella_worker.js',
                src: ['worker/src/main.ts']
            },
            stellerator_dev: {
                dest: 'web/js/compiled/stellerator.js',
                src: ['src/web/stella/stellerator/main.tsx']
            },
            stellerator_prod: {
                dest: 'web/js/compiled/stellerator.prod.js',
                src: ['src/web/stella/stellerator/main.tsx'],
                options: {
                    configure: b => b
                        .plugin('tsify', {project: __dirname})
                        .transform(envify({
                            NODE_ENV: 'production'
                        }), {global: true})
                        .transform('brfs'),
                    browserifyOptions: {
                        debug: true
                    }
                }
            }
        },

        exorcise: {
            stellerator: {
                src: 'web/js/compiled/stellerator.js',
                dest: 'web/js/compiled/stellerator.js.map'
            },
            stella_worker: {
                src: 'web/js/compiled/stella_worker.js',
                dest: 'web/js/compiled/stella_worker.js.map'
            },
            ehBasicCLI: {
                src: 'web/js/compiled/ehBasicCLI.js',
                dest: 'web/js/compiled/ehBasicCLI.js.map'
            },
            debuggerCLI: {
                src: 'web/js/compiled/debuggerCLI.js',
                dest: 'web/js/compiled/debuggerCLI.js.map'
            },
            stellaCLI: {
                src: 'web/js/compiled/stellaCLI.js',
                dest: 'web/js/compiled/stellaCLI.js.map'
            }
        },

        uglify: {
            options: {
                sourceMap: false
            },
            stellerator: {
                dest: 'build/stellerator/js/app.js',
                src: [
                    'web/bower/jquery/dist/jquery.min.js',
                    'web/js/bootstrap.min.js',
                    'web/js/compiled/stellerator.prod.js'
                ]
            },
            stella_worker: {
                dest: 'build/stellerator/js/worker.js',
                src: 'web/js/compiled/stella_worker.js'
            }
        },

        postcss: {
            options: {
                map: false,
                processors: [
                    require('postcss-import')(),
                    require('cssnano')()
                ]
            },
            stellerator: {
                dest: 'build/stellerator/css/app.css',
                src: 'web/css/stellerator.css'
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'nyan',
                    ui: 'tdd',
                    bail: false
                },
                src: ['tests/js/**/*.js', 'tests/ts/**/*.js']
            },
            debug: {
                options: {
                    reporter: 'spec',
                    ui: 'tdd',
                    bail: true
                },
                src: ['tests/js/**/*.js', 'tests/ts/**/*.js']
            }
        },

        'http-server': {
            dev: {
                root: 'web',
                port: 6502,
                host: '127.0.0.1',
                autoIndex: true,
                ext: 'html',
                cache: -1,
                runInBackground: true
            },
            build: {
                root: 'build',
                port: 2600,
                hosts: '127.0.0.1',
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

        template: {
            stellerator_dev: {
                src: 'web/template/stellerator.html',
                dest: 'web/stellerator.html',
                options: {
                    data: {
                        stylesheets: ['css/stellerator.css'],
                        scripts: [
                            'bower/jquery/dist/jquery.min.js',
                            'js/bootstrap.min.js',
                            'js/compiled/stellerator.js'
                        ],
                        workerUrl: 'js/compiled/stella_worker.js'
                    }
                }
            },
            stellerator_build: {
                src: 'web/template/stellerator.html',
                dest: 'build/stellerator/index.html',
                options: {
                    data: {
                        stylesheets: ['css/app.css'],
                        scripts: ['js/app.js'],
                        workerUrl: ['js/worker.js']
                    }
                }
            }
        },

        copy: {
            stellerator: {
                expand: true,
                cwd: 'web',
                src: ['css/fonts/**/*'],
                dest: 'build/stellerator'
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

    grunt.registerTask('browserify_dev', [
        'browserify:debuggerCLI',
        'browserify:ehBasicCLI',
        'browserify:stellaCLI',
        'browserify:stellerator_dev',
        'browserify:stella_worker',
        'exorcise'
    ]);
    grunt.registerTask('browserify_prod', ['browserify:stellerator_prod']);

    grunt.registerTask('template_dev', ['template:stellerator_dev']);

    grunt.registerTask('stellerator:dev', [
        'tslint',
        'browserify:stellerator_dev',
        'browserify:stella_worker',
        'template:stellerator_dev'
    ]);

    grunt.registerTask('stellerator:build', [
        'tslint',
        'browserify:stellerator_prod',
        'browserify:stella_worker',
        'uglify:stellerator',
        'uglify:stella_worker',
        'postcss:stellerator',
        'copy:stellerator',
        'template:stellerator_build'
    ]);

    grunt.registerTask('dev', ['tslint', 'browserify_dev', 'template_dev', 'blobify:default']);
    grunt.registerTask('build', ['stellerator:build']);
    grunt.registerTask('test', ['tslint', 'ts:main', 'blobify:tests', 'mochaTest:test']);
    grunt.registerTask('test:debug', ['tslint', 'ts:main', 'blobify:tests', 'mochaTest:debug']);
    grunt.registerTask('initial', ['clean', 'typings', 'bower', 'test']);

    grunt.registerTask('cleanup', ['clean:base', 'clean:worker']);
    grunt.registerTask('mrproper', ['clean']);

    grunt.registerTask('serve', ['http-server:dev', 'http-server:build']);

    grunt.registerTask('default', ['dev']);

    grunt.task.run('notify_hooks');
};
