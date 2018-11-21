const webpackDev = require('./webpack.dev');

module.exports = (config) => {
    config.set({
        frameworks: ['mocha'],

        files: [
            {pattern: 'test/*.spec.js', watched: false},
            {pattern: 'test/*.spec.ts', watched: false}
        ],

        preprocessors: {
            'test/*.spec.js': ['webpack'],
            'test/*.spec.ts': ['webpack']
        },

        webpack: {
            module: webpackDev.module,
            resolve: webpackDev.resolve,
            mode: webpackDev.mode,
            devtool: webpackDev.devtool
        },

        webpackMiddleware: {
            stats: 'errors-only'
        },

        client: {
            mocha: {
                reporter: 'html'
            }
        }
    });
};
