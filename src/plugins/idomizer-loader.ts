import loaderUtils from 'loader-utils';

const utils = require('./utils');

/**
 * @ignore
 */
module.exports = function (source) {
    const options = loaderUtils.getOptions(this);
    return 'module.exports = ' + utils.toStringFunction(source || '', options || {});
};

