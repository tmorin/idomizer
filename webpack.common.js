const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/idomizer.ts'),
    module: {
        rules: [
            {test: /\.(ts|js)$/, exclude: /node_modules/, loader: 'babel-loader'},
            {test: /\.idomizer$/, loader: 'idomizer/lib/plugins/idomizer-loader'}
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    output: {
        library: 'idomizer',
        libraryTarget: 'umd',
        path: path.resolve(__dirname)
    }
};

