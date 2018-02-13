import * as Webpack from 'webpack';
import * as Path from 'path';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = (env: any = {}) => {
    const PORT = env['port'] || 18000;
    const IS_PROD = env['production'];

    return {
        devtool: 'source-map',
        context: __dirname + '',
        performance: {
            hints: false
        },
        entry: {
            'app': Path.resolve(__dirname, './example/index.tsx')
        },
        resolve: {
            extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.scss', '.css'],
            alias: {},
            modules: [
                'node_modules',
                Path.resolve(__dirname, './node_modules')
            ]
        },
        plugins: [
            IS_PROD && new UglifyJsPlugin({
                parallel: true,
                sourceMap: true
            }),
            new Webpack.DefinePlugin({
                'process.env': {
                    'ENV': JSON.stringify(IS_PROD ? 'production' : 'development'),
                    'NODE_ENV': JSON.stringify(IS_PROD ? 'production' : 'development')
                }
            }),
            new Webpack.LoaderOptionsPlugin({
                options: {
                    tslint: {
                        emitErrors: false,
                        failOnHint: false
                    },
                    context: '/'
                }
            }),
            new HtmlWebpackPlugin({
                template: Path.resolve(__dirname, './example/index.html'),
                inject: 'body',
                baseUrl: '/'
            })
        ].filter(v => !!v),
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.tsx?$/,
                    loader: 'tslint-loader'
                },
                {
                    enforce: 'pre',
                    test: /\.jsx?$/,
                    loader: 'source-map-loader'
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader'
                },
            ]
        },
        devServer: {
            port: PORT,
            historyApiFallback: true
        }
    };
};
