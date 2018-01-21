import * as Webpack from 'webpack';
import * as Path from 'path';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';

module.exports = (env: any = {}) => {
    const PORT = env['port'] || 18000;

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
            new Webpack.DefinePlugin({
                'process.env': {
                    'ENV': JSON.stringify('development'),
                    'NODE_ENV': JSON.stringify('development')
                }
            }),
            new Webpack.LoaderOptionsPlugin({
                options: {
                    tslint: {
                        emitErrors: false,
                        failOnHint: false
                    },
                    postcss: [
                        require('postcss-mixins')(),
                        require('postcss-each')(),
                        require('postcss-cssnext')()
                    ],
                    context: '/'
                }
            }),
            new HtmlWebpackPlugin({
                template: Path.resolve(__dirname, './example/index.html'),
                inject: 'body',
                baseUrl: '/'
            }),
            new Webpack.HotModuleReplacementPlugin(),
            new Webpack.NamedModulesPlugin()
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
                {
                    test: /(\.css$|\.scss$)/,
                    use: [
                        { loader: 'style-loader' },
                        {
                            loader: 'css-loader',
                            query: {
                                modules: true,
                                minimize: false,
                                sourceMap: true,
                                localIdentName: '[name]__[local]___[hash:base64:5]'
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true
                            }
                        },
                        { loader: 'resolve-url-loader' },
                        {
                            loader: 'sass-loader',
                            query: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|gif|svg|ttf|eot|woff|woff2)$/,
                    loader: 'url-loader',
                    query: {
                        limit: 65536
                    }
                }
            ]
        },
        devServer: {
            port: PORT,
            historyApiFallback: true
        }
    };
};
