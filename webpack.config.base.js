'use strict';

var webpack = require('webpack');

module.exports = {
    module: {
        loaders: [
            {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel'},
            {test: /\.json/, loader: 'json'}
        ]
    },
    output: {
        library: 'idomizer',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['', '.js']
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