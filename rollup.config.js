import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import { uglify } from 'rollup-plugin-uglify';

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
        uglify()
    ],
    onwarn: (warning, warn) => {
        if (warning.code === 'EVAL' && warning.id.match(/thumbulator\.js$/)) return;
        warn(warning);
    }
});

export default [
    worker('worker/src/main/stellerator.ts', 'dist/worker/stellerator.min.js'),
    worker('worker/src/main/video-pipeline.ts', 'dist/worker/video-pipeline.min.js')
];
