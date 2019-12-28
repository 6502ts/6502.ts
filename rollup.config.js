'use strict';

import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import elm from 'rollup-plugin-elm';
import { terser } from 'rollup-plugin-terser';
import html from 'rollup-plugin-bundle-html';
import scss from 'rollup-plugin-scss';
import copy from 'rollup-plugin-copy';
import globals from 'rollup-plugin-node-globals';
import replace from 'rollup-plugin-replace';
import sizes from 'rollup-plugin-sizes';
import rollupGitVersion from 'rollup-plugin-git-version';
import path from 'path';
const { generateSW } = require('rollup-plugin-workbox');

const DEVELOPMENT = !!process.env.DEVELOPMENT;
const dist = p => path.join(DEVELOPMENT ? 'dist-dev' : 'dist', p);

const worker = ({ input, output }) => ({
    input,
    output: {
        file: output,
        format: 'iife',
        sourcemap: true,
        name: 'worker'
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs({
            ignore: [],
            namedExports: {
                'node_modules/seedrandom/index.js': ['alea'],
                'node_modules/setimmediate2/dist/setImmediate.js': ['setImmediate']
            }
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'es2015'
                }
            },
            tsconfig: 'worker/tsconfig.json',
            objectHashIgnoreUnknownHack: true
        }),
        globals(),
        builtins(),
        ...(DEVELOPMENT ? [] : [terser()]),
        copy({
            targets: [output, `${output}.map`].map(src => ({ src, dest: dist('frontend/stellerator/worker') })),
            hook: 'writeBundle'
        })
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

const elmFrontend = ({ input, output, template, extraAssets = [], serviceWorker }) => ({
    input,
    output: {
        file: path.join(output, 'app.js'),
        format: 'iife',
        sourcemap: true,
        name: 'app'
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        elm({
            compiler: {
                optimize: !DEVELOPMENT,
                pathToElm: path.resolve(__dirname, 'node_modules/.bin/elm')
            }
        }),
        scss({
            includePaths: [path.resolve(__dirname, 'node_modules')],
            outputStyle: 'compressed'
        }),
        rollupGitVersion(),
        replace({
            include: 'node_modules/jszip/**/*.js',
            values: {
                'readable-stream': `stream`
            }
        }),
        replace({ 'process.env.DEVELOPMENT': JSON.stringify(DEVELOPMENT) }),
        commonjs({
            namedExports: {
                'node_modules/seedrandom/index.js': ['alea'],
                'node_modules/setimmediate2/dist/setImmediate.js': ['setImmediate']
            },
            extensions: ['.js']
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'es2015'
                }
            },
            tsconfig: 'tsconfig.json',
            objectHashIgnoreUnknownHack: true
        }),
        globals(),
        builtins(),
        ...(DEVELOPMENT ? [] : [terser()]),
        html({
            template: template,
            dest: output,
            filename: 'index.html',
            inject: 'head',
            ignore: /worker/
        }),
        ...(serviceWorker && !DEVELOPMENT ? [generateSW(serviceWorker)] : []),
        copy({
            targets: ['src/frontend/theme/assets', 'assets', ...extraAssets].map(src => ({ src, dest: output }))
        }),
        sizes()
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

export default [
    worker({ input: 'worker/src/main/stellerator.ts', output: dist('worker/stellerator.min.js') }),
    worker({ input: 'worker/src/main/video-pipeline.ts', output: dist('worker/video-pipeline.min.js') }),
    elmFrontend({
        input: 'src/frontend/stellerator/index.ts',
        output: dist('frontend/stellerator'),
        template: 'template/stellerator.html',
        extraAssets: ['doc'],
        serviceWorker: {
            swDest: dist('frontend/stellerator/service-worker.js'),
            globDirectory: dist('frontend/stellerator'),
            globPatterns: ['**/*'],
            globIgnores: ['**/*.map', '**/doc/images/orig/**'],
            importWorkboxFrom: 'cdn',
            cacheId: 'stellerator-ng'
        }
    }),
    elmFrontend({
        input: 'src/frontend/ui-playground/index.ts',
        output: dist('frontend/ui-playground'),
        template: 'template/ui-playground.html'
    })
];
