module.exports = {
    entry: './src/dummy.js',
    module: {
        loaders: [
            {test: /\.idomizer?$/, loader: '../../../lib/plugins/idomizer-loader.js'},
            {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel'}
        ]
    },
    output: {
        path: './lib',
        filename: 'dummy.js'
    }
};
