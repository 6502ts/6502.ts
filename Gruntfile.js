/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

const path = require('path'),
    envify = require('envify/custom'),
    cp = require('child_process');

const TSLINT_OPTIONS = `--project ./tsconfig.json --config ./tslint.json --exclude '**/*.js'`;

const LICENSE_PREAMPLE = `
/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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
 *   Please go to the project's github page at
 *
 *   https://github.com/6502ts/6502.ts
 *
 *   for more details and for a copy of the GNU General Public License v2.
 */
`;

module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-http-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-exorcise');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-typedoc');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.loadTasks('./grunt');

    let buildId;
    try {
        buildId = cp
            .execFileSync('git', ['rev-parse', '--short=6', 'HEAD'], {
                encoding: 'utf-8'
            })
            .replace(/\s/, '');
    } catch (e) {
        buildId = '[unknown]';
    }

    grunt.initConfig({
        ts: {
            main: {
                tsconfig: {
                    tsconfig: '.',
                    passThrough: true
                }
            }
        },

        clean: {
            base: [
                '.tscache',
                'web/js/compiled',
                'web/js/installed',
                'tests/fixtures/fs_provider/blob.json',
                'web/stellerator.html',
                'build',
                'compiled',
                'typedoc'
            ],
            mrproper: ['web/js/installed', 'web/css/installed']
        },

        exec: {
            tslint: {
                cmd: `${path.join(__dirname, 'node_modules', '.bin', 'tslint')} ${TSLINT_OPTIONS}`
            }
        },

        browserify: {
            options: {
                configure: b => b.plugin('tsify', { project: __dirname }),
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
                    },
                    cacheFile: 'foo.json'
                }
            },
            stellerator_worker: {
                options: {
                    configure: b => b.plugin('tsify', { project: path.join(__dirname, 'worker') })
                },
                dest: 'web/js/compiled/worker/stellerator_worker.js',
                src: ['worker/src/main/stellerator.ts']
            },
            video_pipeline_worker: {
                options: {
                    configure: b => b.plugin('tsify', { project: path.join(__dirname, 'worker') })
                },
                dest: 'web/js/compiled/worker/video_pipeline_worker.js',
                src: ['worker/src/main/video-pipeline.ts']
            },
            stellerator_dev: {
                dest: 'web/js/compiled/stellerator.js',
                src: ['src/web/stella/stellerator/main.tsx'],
                options: {
                    configure: b =>
                        b.plugin('tsify', { project: __dirname }).transform(
                            envify({
                                NODE_ENV: 'development',
                                STELLERATOR_WORKER_URL: 'js/compiled/worker/stellerator_worker.js',
                                VIDEO_PIPELINE_WORKER_URL: 'js/compiled/worker/video_pipeline_worker.js',
                                HELPPAGE_URL: 'doc/stellerator.md',
                                BUILD_ID: buildId
                            }),
                            { global: true }
                        ),
                    browserifyOptions: {
                        debug: true
                    }
                }
            },
            stellerator_prod: {
                dest: 'web/js/compiled/stellerator.prod.js',
                src: ['src/web/stella/stellerator/main.tsx'],
                options: {
                    configure: b =>
                        b.plugin('tsify', { project: __dirname }).transform(
                            envify({
                                NODE_ENV: 'production',
                                STELLERATOR_WORKER_URL: 'js/worker/stellerator_worker.min.js',
                                VIDEO_PIPELINE_WORKER_URL: 'js/worker/video_pipeline_worker.min.js',
                                HELPPAGE_URL: 'doc/stellerator.md',
                                BUILD_ID: buildId
                            }),
                            { global: true }
                        ),
                    browserifyOptions: {
                        debug: true
                    }
                }
            },
            stellerator_embedded: {
                dest: 'web/js/compiled/stellerator_embedded.js',
                src: ['src/web/embedded/stellerator/index.ts'],
                options: {
                    browserifyOptions: {
                        standalone: '$6502',
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
            stellerator_worker: {
                src: 'web/js/compiled/worker/stellerator_worker.js',
                dest: 'web/js/compiled/worker/stellerator_worker.js.map'
            },
            video_pipeline_worker: {
                src: 'web/js/compiled/worker/video_pipeline_worker.js',
                dest: 'web/js/compiled/worker/video_pipeline_worker.js.map'
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
            },
            stellerator_embedded: {
                src: 'web/js/compiled/stellerator_embedded.js',
                dest: 'web/js/compiled/stellerator_embedded.js.map'
            }
        },

        uglify: {
            options: {
                sourceMap: true,
                banner: LICENSE_PREAMPLE
            },
            stellerator: {
                dest: 'build/stellerator/js/app.js',
                src: [
                    'web/js/installed/jquery.min.js',
                    'web/js/bootstrap.min.js',
                    'web/js/compiled/stellerator.prod.js'
                ]
            },
            video_pipeline_worker: {
                src: 'web/js/compiled/worker/video_pipeline_worker.js',
                dest: 'web/js/compiled/worker/video_pipeline_worker.min.js',
                options: {
                    sourceMapIn: 'web/js/compiled/worker/video_pipeline_worker.js.map'
                }
            },
            stellerator_worker: {
                src: 'web/js/compiled/worker/stellerator_worker.js',
                dest: 'web/js/compiled/worker/stellerator_worker.min.js',
                options: {
                    sourceMapIn: 'web/js/compiled/worker/stellerator_worker.js.map'
                }
            },
            stellerator_embedded: {
                src: 'web/js/compiled/stellerator_embedded.js',
                dest: 'web/js/compiled/stellerator_embedded.min.js',
                options: {
                    sourceMapIn: 'web/js/compiled/stellerator_embedded.js.map'
                }
            }
        },

        postcss: {
            options: {
                map: false,
                processors: [require('postcss-import')(), require('cssnano')()]
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
                    bail: false,
                    require: 'source-map-support/register'
                },
                src: ['compiled/tests/ts/**/*.js']
            },
            debug: {
                options: {
                    reporter: 'spec',
                    ui: 'tdd',
                    bail: true
                },
                src: ['compiled/tests/ts/**/*.js']
            }
        },

        'http-server': {
            dev: {
                root: 'web',
                port: 6502,
                host: '127.0.0.1',
                autoIndex: true,
                ext: 'html',
                cache: 0,
                runInBackground: true
            },
            build: {
                root: 'build',
                port: 2600,
                host: '127.0.0.1',
                autoIndex: true,
                ext: 'html',
                cache: 0
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
                dest: './compiled/tests/fixtures/fs_provider/blob.json'
            }
        },

        template: {
            stellerator_dev: {
                src: 'web/template/stellerator.html',
                dest: 'web/stellerator.html',
                options: {
                    data: {
                        stylesheets: ['css/stellerator.css'],
                        scripts: ['js/installed/jquery.min.js', 'js/bootstrap.min.js', 'js/compiled/stellerator.js'],
                        dev: true
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
                        dev: false
                    }
                }
            },
            stellerator_appcache: {
                src: 'web/template/stellerator.appcache',
                dest: 'build/stellerator/stellerator.appcache'
            }
        },

        compress: {
            stellerator_embedded: {
                options: {
                    archive: 'dist/stellerator_embedded.zip',
                    mode: 'zip'
                },
                files: [
                    {
                        cwd: 'web/js/compiled',
                        expand: true,
                        src: ['stellerator_embedded.min.js', 'stellerator_embedded.min.js.map']
                    },
                    {
                        cwd: 'web/js/compiled/worker',
                        expand: true,
                        src: ['stellerator_worker.min.js', 'stellerator_worker.min.js.map']
                    }
                ]
            }
        },

        copy: {
            stellerator_prod: {
                files: [
                    {
                        expand: true,
                        cwd: 'web',
                        src: ['css/fonts/**/*'],
                        dest: 'build/stellerator'
                    },
                    {
                        expand: true,
                        src: ['doc/**/*'],
                        dest: 'build/stellerator'
                    },
                    {
                        src: 'web/js/compiled/worker/stellerator_worker.min.js',
                        dest: 'build/stellerator/js/worker/stellerator_worker.min.js'
                    },
                    {
                        src: 'web/js/compiled/worker/video_pipeline_worker.min.js',
                        dest: 'build/stellerator/js/worker/video_pipeline_worker.min.js'
                    },
                    {
                        src: 'web/stellerator_homescreen_icon.png',
                        dest: 'build/stellerator/stellerator_homescreen_icon.png'
                    }
                ]
            },
            stellerator_dev: {
                files: [
                    {
                        expand: true,
                        src: ['doc/**/*'],
                        dest: 'web'
                    }
                ]
            },
            test_fixtures: {
                files: [
                    {
                        expand: true,
                        cwd: 'tests',
                        src: ['fixtures/**/*'],
                        dest: 'compiled/tests'
                    }
                ]
            },
            install: {
                files: {
                    'web/js/installed/jquery.min.js': 'node_modules/jquery/dist/jquery.min.js',
                    'web/js/installed/jquery.terminal.min.js': 'node_modules/jquery.terminal/js/jquery.terminal.min.js',
                    'web/js/installed/jquery.mousewheel.min.js':
                        'node_modules/jquery.terminal/js/jquery.mousewheel-min.js',
                    'web/css/installed/jquery.terminal.min.css': 'node_modules/jquery.terminal/css/jquery.terminal.css'
                }
            }
        },

        typedoc: {
            stellerator_embedded: {
                options: {
                    module: 'commonjs',
                    out: 'typedoc/stellerator-embedded',
                    name: 'Stellerator embedded',
                    target: 'es5',
                    theme: 'minimal',
                    excludePrivate: true,
                    excludeExternals: true,
                    mode: 'modules',
                    readme: 'doc/stellerator_embedded.md',
                    exclude: '**/+(index.ts|ControlPanelProxy.ts|SwitchProxy.ts)'
                },
                src: ['src/web/embedded/stellerator']
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

    grunt.registerTask('browserify_dev', [
        'browserify:debuggerCLI',
        'browserify:ehBasicCLI',
        'browserify:stellaCLI',
        'browserify:stellerator_dev',
        'browserify:stellerator_worker',
        'browserify:video_pipeline_worker',
        'browserify:stellerator_embedded',
        'exorcise'
    ]);
    grunt.registerTask('browserify_prod', ['browserify:stellerator_prod']);

    grunt.registerTask('template_dev', ['template:stellerator_dev']);

    grunt.registerTask('stellerator:dev', [
        'tslint',
        'browserify:stellerator_dev',
        'browserify:stellerator_worker',
        'browserify:video_pipeline_worker',
        'exorcise:stellerator',
        'exorcise:stellerator_worker',
        'exorcise:video_pipeline_worker',
        'template:stellerator_dev',
        'copy:stellerator_dev'
    ]);

    grunt.registerTask('stellerator:build', [
        'tslint',
        'browserify:stellerator_prod',
        'browserify:stellerator_worker',
        'browserify:video_pipeline_worker',
        'exorcise:stellerator_worker',
        'exorcise:video_pipeline_worker',
        'uglify:stellerator',
        'uglify:stellerator_worker',
        'uglify:video_pipeline_worker',
        'postcss:stellerator',
        'copy:stellerator_prod',
        'template:stellerator_build',
        'template:stellerator_appcache'
    ]);

    grunt.registerTask('stellerator_embedded:build', [
        'tslint',
        'browserify:stellerator_embedded',
        'exorcise:stellerator_embedded',
        'uglify:stellerator_embedded',
        'browserify:stellerator_worker',
        'exorcise:stellerator_worker',
        'uglify:stellerator_worker',
        'compress:stellerator_embedded'
    ]);

    grunt.registerTask('tslint', ['exec:tslint']);
    grunt.registerTask('dev', ['tslint', 'browserify_dev', 'template_dev', 'blobify:default', 'copy:stellerator_dev']);
    grunt.registerTask('build', ['stellerator:build', 'stellerator_embedded:build']);
    grunt.registerTask('test', ['tslint', 'ts:main', 'copy:test_fixtures', 'blobify:tests', 'mochaTest:test']);
    grunt.registerTask('test:debug', ['tslint', 'ts:main', 'copy:test_fixtures', 'blobify:tests', 'mochaTest:debug']);
    grunt.registerTask('initial', ['clean', 'copy:install', 'test']);

    grunt.registerTask('cleanup', ['clean:base', 'clean:worker']);
    grunt.registerTask('mrproper', ['clean']);

    grunt.registerTask('serve', ['http-server:dev', 'http-server:build']);

    grunt.registerTask('default', ['dev']);

    grunt.task.run('notify_hooks');
};
