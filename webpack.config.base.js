'use strict';

var webpack = require('webpack');

module.exports = {
    module: {
        rules: [
            {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
            {test: /\.json/, loader: 'json-loader'}
        ]
    },
    output: {
        library: 'idomizer',
        libraryTarget: 'umd'
    },
    devServer: {
        contentBase: './dist',
        noInfo: false,
        hot: true,
        inline: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }
};
