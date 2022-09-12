const { resolve } = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { merge } = require('webpack-merge');
const { execSync } = require('child_process');
const package = require('./package.json');

function getGitRev() {
    const rev = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trimEnd();

    if (!/^[0-9a-f]{7}$/.test(rev)) throw new Error(`unable to determine git revision; command returned ${rev}`);

    return rev;
}

module.exports = (env, args) => {
    const buildConfig = (config, files = {}) =>
        merge(config, {
            devtool: 'source-map',
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        loader: 'ts-loader',
                        exclude: /node_modules/,
                    },
                    {
                        test: /\.elm$/,
                        exclude: [/elm-stuff/, /node_modules/],
                        loader: 'elm-webpack-loader',
                    },
                    {
                        test: /\.s[ac]ss$/i,
                        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
                    },
                ],
            },
            resolve: {
                extensions: ['.ts', '.js', '.elm'],
            },
            plugins: [
                new webpack.IgnorePlugin({
                    resourceRegExp: /^fs$/,
                }),
                new FileManagerPlugin({
                    events: {
                        onEnd: {
                            copy: Object.entries(files).map(([source, destination]) => ({
                                source: source.replace(/^.*\|/, ''),
                                destination,
                            })),
                        },
                    },
                }),
                new webpack.EnvironmentPlugin({
                    NODE_ENV: args.mode,
                    VERSION:
                        args.mode === 'development'
                            ? `${package.version}-${getGitRev()}-dev`
                            : `${package.version}-${getGitRev()}`,
                    PREVIEW: process.env.PREVIEW ? 'true' : '',
                }),
            ],
            performance: {
                maxEntrypointSize: 1024 * 1024,
                maxAssetSize: 1024 * 1024,
            },
        });

    const dist = args.mode === 'development' ? 'dist-dev' : 'dist';

    const config = [
        buildConfig(
            {
                entry: './worker/src/main/stellerator.ts',
                output: {
                    path: resolve(__dirname, `${dist}/worker`),
                    filename: 'stellerator.js',
                },
            },
            {
                [`1|${dist}/worker/**/*`]: `${dist}/stellerator-ng/worker`,
                [`2|${dist}/worker/**/*`]: `${dist}/stellerator-embedded/worker`,
                [`${dist}/worker/stellerator.js`]: `${dist}/embedded-bundle/`,
                [`${dist}/worker/stellerator.js.map`]: `${dist}/embedded-bundle/`,
            }
        ),
        buildConfig(
            {
                entry: './src/web/embedded/stellerator/index.ts',
                output: {
                    path: resolve(__dirname, `${dist}/stellerator-embedded`),
                    filename: 'stellerator-embedded.js',
                    library: {
                        name: '$6502',
                        type: 'umd',
                    },
                    libraryExport: 'default',
                },
            },
            {
                'html/stellerator-embedded.html': `${dist}/stellerator-embedded/index.html`,
                'aux/2600/flapping/flapping.bin': `${dist}/stellerator-embedded/`,
                [`${dist}/stellerator-embedded/stellerator-embedded.js`]: `${dist}/embedded-bundle/`,
                [`${dist}/stellerator-embedded/stellerator-embedded.js.map`]: `${dist}/embedded-bundle/`,
            }
        ),
        buildConfig(
            {
                entry: './src/frontend/stellerator/index.ts',
                plugins: [
                    new MiniCssExtractPlugin({
                        filename: 'app.css',
                    }),
                ],
                output: {
                    path: resolve(__dirname, `${dist}/stellerator-ng`),
                    filename: 'app.js',
                },
            },
            {
                'html/stellerator.html': `${dist}/stellerator-ng/index.html`,
                'LICENSE.md': `${dist}/stellerator-ng/`,
                'README.md': `${dist}/stellerator-ng/`,
                'CHANGELOG.md': `${dist}/stellerator-ng/`,
                'doc/**/*': `${dist}/stellerator-ng/doc/`,
                'assets/**/*': `${dist}/stellerator-ng/assets/`,
            }
        ),
    ];

    return config;
};
