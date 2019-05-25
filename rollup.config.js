import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import elm from 'rollup-plugin-elm';
import { terser } from 'rollup-plugin-terser';
import html from 'rollup-plugin-bundle-html';
import scss from 'rollup-plugin-scss';
import copy from 'rollup-plugin-copy';
import path from 'path';

const worker = (input, output) => ({
    input,
    output: {
        file: output,
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve(),
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
        builtins(),
        terser()
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

const elmFrontend = (input, outputDirectory, htmlTemplate) => ({
    input,
    output: {
        file: path.join(outputDirectory, 'app.js'),
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve(),
        elm({
            compiler: {
                optimize: true,
                pathToElm: path.resolve(__dirname, 'node_modules/.bin/elm')
            }
        }),
        scss({
            includePaths: [path.resolve(__dirname, 'node_modules')],
            outputStyle: 'compressed'
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
        builtins(),
        terser(),
        html({
            template: htmlTemplate,
            dest: outputDirectory,
            filename: 'index.html',
            inject: 'head',
            externals: [
                {
                    file: path.join(outputDirectory, 'app.css'),
                    type: 'css'
                }
            ]
        }),
        copy({
            targets: ['styles/assets'],
            outputFolder: outputDirectory
        })
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

export default [
    // worker('worker/src/main/stellerator.ts', 'dist/worker/stellerator.min.js'),
    // worker('worker/src/main/video-pipeline.ts', 'dist/worker/video-pipeline.min.js'),
    elmFrontend('src/frontend/stellerator/index.ts', 'dist/frontend/stellerator', 'template/stellerator.html')
];
