import {makeStringTransform} from 'browserify-transform-tools';
import {toStringFunction} from './utils.js';

var options = {
    includeExtensions: ['.idomizer']
};

/**
 * @ignore
 */
export default makeStringTransform('idomizerify', options, (content, transformOptions, done) => {
    done(null, 'module.exports = ' + toStringFunction(content, transformOptions.config));
});
