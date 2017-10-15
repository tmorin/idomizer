'use strict';

const webpack = require('webpack');

module.exports = {
    module: {
        rules: [
            {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
            {test: /\.json/, loader: 'json-loader'},
            {test: /\.idomizer$/, loader: 'idomizer/lib/plugins/idomizer-loader'}
        ]
    },
    output: {
        library: 'idomizer',
        libraryTarget: 'umd'
    }
};
