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
import path from 'path';

const worker = ({ input, output }) => ({
    input,
    output: {
        file: output,
        format: 'cjs',
        sourcemap: true
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
            tsconfig: 'worker/tsconfig.json'
        }),
        globals(),
        builtins(),
        ...(process.env.DEV ? [] : [terser()])
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

const elmFrontend = ({ input, output, template, extraAssets = [] }) => ({
    input,
    output: {
        file: path.join(output, 'app.js'),
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        elm({
            compiler: {
                optimize: !process.env.DEV,
                pathToElm: path.resolve(__dirname, 'node_modules/.bin/elm')
            }
        }),
        scss({
            includePaths: [path.resolve(__dirname, 'node_modules')],
            outputStyle: 'compressed'
        }),
        replace({
            include: 'node_modules/jszip/**/*.js',
            values: {
                'readable-stream': `stream`
            }
        }),
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
        ...(process.env.DEV ? [] : [terser()]),
        html({
            template: template,
            dest: output,
            filename: 'index.html',
            inject: 'head',
            externals: [
                {
                    file: path.join(output, 'app.css'),
                    type: 'css'
                }
            ]
        }),
        copy({
            targets: ['src/frontend/theme/assets', ...extraAssets],
            outputFolder: output
        }),
        sizes()
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

export default [
    worker({ input: 'worker/src/main/stellerator.ts', output: 'dist/worker/stellerator.min.js' }),
    worker({ input: 'worker/src/main/video-pipeline.ts', output: 'dist/worker/video-pipeline.min.js' }),
    elmFrontend({
        input: 'src/frontend/stellerator/index.ts',
        output: 'dist/frontend/stellerator',
        template: 'template/stellerator.html',
        extraAssets: ['doc']
    }),
    elmFrontend({
        input: 'src/frontend/ui-playground/index.ts',
        output: 'dist/frontend/ui-playground',
        template: 'template/ui-playground.html'
    })
];
