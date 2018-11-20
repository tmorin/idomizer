const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/idomizer.js'),
    module: {
        rules: [
            {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
            {test: /\.idomizer$/, loader: 'idomizer/lib/plugins/idomizer-loader'}
        ]
    },
    output: {
        library: 'idomizer',
        libraryTarget: 'umd',
        path: path.resolve(__dirname)
    }
};

