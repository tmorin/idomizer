module.exports = {
    entry: './lib/dummy.js',
    module: {
        loaders: [
            {test: /\.idomizer?$/, loader: '../../../lib/plugins/idomizer-loader.js'}
        ]
    },
    output: {
        path: './dist',
        filename: 'dummy.js'
    }
};
