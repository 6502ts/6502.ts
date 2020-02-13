/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

'use strict';

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import elm from 'rollup-plugin-elm';
import { terser } from 'rollup-plugin-terser';
import html from 'rollup-plugin-bundle-html';
import scss from 'rollup-plugin-scss';
import copy from 'rollup-plugin-copy';
import globals from 'rollup-plugin-node-globals';
import replace from '@rollup/plugin-replace';
import sizes from 'rollup-plugin-sizes';
import rollupGitVersion from 'rollup-plugin-git-version';
import path from 'path';
const { generateSW } = require('rollup-plugin-workbox');

const DEVELOPMENT = !!process.env.DEVELOPMENT;
const dist = p => path.join(DEVELOPMENT ? 'dist-dev' : 'dist', p);

const cfg = {
    commonjs: {
        ignore: [],
        namedExports: {
            'node_modules/seedrandom/index.js': ['alea'],
            'node_modules/setimmediate2/dist/setImmediate.js': ['setImmediate']
        }
    },
    typescript: {
        module: 'es2015',
        tsconfig: 'tsconfig.json'
    },
    replace: {
        include: 'node_modules/jszip/**/*.js',
        values: {
            'readable-stream': `stream`
        }
    },
    elm: {
        compiler: {
            optimize: !DEVELOPMENT,
            debug: !!DEVELOPMENT,
            pathToElm: path.resolve(__dirname, 'node_modules/.bin/elm')
        }
    },
    scss: {
        includePaths: [path.resolve(__dirname, 'node_modules')],
        outputStyle: 'compressed'
    }
};

const onwarn = (warning, warn) => {
    if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
    warn(warning);
};

const worker = ({ input, output, distributeTo }) => ({
    input,
    output: {
        file: output,
        format: 'iife',
        sourcemap: true,
        name: 'worker'
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs(cfg.commonjs),
        typescript({ ...cfg.typescript, tsconfig: 'worker/tsconfig.json' }),
        globals(),
        builtins(),
        ...(DEVELOPMENT ? [] : [terser()]),
        ...(distributeTo
            ? [
                  copy({
                      targets: [output, `${output}.map`]
                          .map(src => distributeTo.map(x => ({ src, dest: dist(x) })))
                          .reduce((acc, x) => acc.concat(x), []),
                      hook: 'writeBundle'
                  })
              ]
            : []),
        sizes()
    ],
    onwarn
});

const library = ({ input, output, name, copy: copyCfg }) => ({
    input,
    output: {
        file: output,
        format: 'umd',
        sourcemap: true,
        name
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs(cfg.commonjs),
        typescript(cfg.typescript),
        globals(),
        builtins(),
        ...(DEVELOPMENT ? [] : [terser()]),
        ...(copyCfg ? [copy(copyCfg)] : []),
        sizes()
    ],
    onwarn
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
        elm(cfg.elm),
        scss(cfg.scss),
        rollupGitVersion(),
        replace(cfg.replace),
        replace({ 'process.env.DEVELOPMENT': JSON.stringify(DEVELOPMENT) }),
        commonjs(cfg.commonjs),
        typescript(cfg.typescript),
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
    onwarn
});

export default [
    worker({
        input: 'worker/src/main/stellerator.ts',
        output: dist('worker/stellerator.min.js'),
        distributeTo: ['frontend/stellerator/worker', 'stellerator-embedded/worker']
    }),
    worker({
        input: 'worker/src/main/video-pipeline.ts',
        output: dist('worker/video-pipeline.min.js'),
        distributeTo: ['frontend/stellerator/worker']
    }),
    library({
        input: 'src/web/embedded/stellerator/index.ts',
        output: dist('stellerator-embedded/stellerator-embedded.min.js'),
        name: '$6502',
        copy: {
            targets: [{ src: 'template/stellerator-embedded.html', dest: dist('stellerator-embedded') }]
        }
    }),
    elmFrontend({
        input: 'src/frontend/stellerator/index.ts',
        output: dist('frontend/stellerator'),
        template: 'template/stellerator.html',
        extraAssets: ['doc', 'CHANGELOG.md', 'LICENSE.md'],
        serviceWorker: {
            swDest: dist('frontend/stellerator/service-worker.js'),
            globDirectory: dist('frontend/stellerator'),
            globPatterns: ['**/*'],
            globIgnores: ['**/*.map', '**/doc/images/orig/**'],
            cacheId: 'stellerator-ng',
            skipWaiting: true,
            clientsClaim: true
        }
    }),
    elmFrontend({
        input: 'src/frontend/ui-playground/index.ts',
        output: dist('frontend/ui-playground'),
        template: 'template/ui-playground.html'
    })
];
